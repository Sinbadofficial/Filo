import { NextResponse } from "next/server";
import {
  getPathaoWebhookSecret,
  pathaoWebhookResponseHeaders,
  processPathaoWebhook,
  type PathaoWebhookPayload,
} from "@/lib/pathao-webhook";

function jsonWithPathaoHeaders(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: pathaoWebhookResponseHeaders(),
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as PathaoWebhookPayload;

    if (!payload?.event) {
      return jsonWithPathaoHeaders({ error: "Invalid payload" }, 400);
    }

    const signature = request.headers.get("x-pathao-signature");
    const secret = getPathaoWebhookSecret();
    if (secret && signature && signature !== secret) {
      return jsonWithPathaoHeaders({ error: "Invalid signature" }, 401);
    }

    if (payload.event === "webhook_integration") {
      return new NextResponse(null, {
        status: 202,
        headers: pathaoWebhookResponseHeaders(),
      });
    }

    const result = await processPathaoWebhook(payload);
    return jsonWithPathaoHeaders({ received: true, ...result }, 200);
  } catch (error) {
    return jsonWithPathaoHeaders(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      500
    );
  }
}
