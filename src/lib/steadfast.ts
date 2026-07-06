export type SteadfastOrderPayload = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  amountToCollect: number;
  itemDescription: string;
  orderNumber: string;
};

export type SteadfastOrderResult = {
  success: boolean;
  trackingId?: string;
  message: string;
};

export async function createSteadfastOrder(
  payload: SteadfastOrderPayload
): Promise<SteadfastOrderResult> {
  const apiKey = process.env.STEADFAST_API_KEY;
  const secretKey = process.env.STEADFAST_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return {
      success: true,
      trackingId: `SF-MOCK-${payload.orderNumber}`,
      message:
        "Steadfast credentials not configured. Mock tracking ID created. Set STEADFAST_API_KEY and STEADFAST_SECRET_KEY in .env.",
    };
  }

  try {
    const response = await fetch("https://portal.packzy.com/api/v1/create_order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
      },
      body: JSON.stringify({
        invoice: payload.orderNumber,
        recipient_name: payload.customerName,
        recipient_phone: payload.customerPhone,
        recipient_address: payload.customerAddress,
        cod_amount: payload.amountToCollect,
        note: payload.itemDescription,
        item_description: payload.itemDescription,
        total_lot: 1,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, message: `Steadfast API error: ${text}` };
    }

    const data = (await response.json()) as {
      consignment?: { tracking_code?: string; invoice?: string };
    };

    return {
      success: true,
      trackingId: data.consignment?.tracking_code || data.consignment?.invoice,
      message: "Order created on Steadfast",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Steadfast request failed",
    };
  }
}
