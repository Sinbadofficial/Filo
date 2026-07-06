import { prisma } from "@/lib/prisma";

type NotifyChannel = "sms" | "whatsapp";

async function logNotification(
  channel: NotifyChannel,
  phone: string,
  message: string,
  userId?: string,
  status: "sent" | "failed" | "pending" = "pending"
) {
  return prisma.notification.create({
    data: { channel, phone, message, userId, status },
  });
}

export async function sendSMS(phone: string, message: string, userId?: string) {
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || "ResellBD";

  const log = await logNotification("sms", phone, message, userId);

  if (!apiKey) {
    console.log(`[SMS MOCK] To: ${phone} | ${message}`);
    await prisma.notification.update({
      where: { id: log.id },
      data: { status: "sent" },
    });
    return { success: true, mock: true };
  }

  try {
    const res = await fetch("https://api.sms.net.bd/sendsms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        msg: message,
        to: phone,
        sender_id: senderId,
      }),
    });

    const ok = res.ok;
    await prisma.notification.update({
      where: { id: log.id },
      data: { status: ok ? "sent" : "failed" },
    });
    return { success: ok };
  } catch {
    await prisma.notification.update({
      where: { id: log.id },
      data: { status: "failed" },
    });
    return { success: false };
  }
}

export async function sendWhatsApp(phone: string, message: string, userId?: string) {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  const log = await logNotification("whatsapp", phone, message, userId);

  if (!token || !phoneId) {
    console.log(`[WhatsApp MOCK] To: ${phone} | ${message}`);
    await prisma.notification.update({
      where: { id: log.id },
      data: { status: "sent" },
    });
    return { success: true, mock: true };
  }

  try {
    const normalized = phone.replace(/^0/, "880");
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalized,
        type: "text",
        text: { body: message },
      }),
    });

    const ok = res.ok;
    await prisma.notification.update({
      where: { id: log.id },
      data: { status: ok ? "sent" : "failed" },
    });
    return { success: ok };
  } catch {
    await prisma.notification.update({
      where: { id: log.id },
      data: { status: "failed" },
    });
    return { success: false };
  }
}

export async function notifyReseller(
  userId: string,
  phone: string | null | undefined,
  message: string
) {
  if (!phone) return;
  await Promise.all([sendSMS(phone, message, userId), sendWhatsApp(phone, message, userId)]);
}
