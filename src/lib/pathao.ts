export type PathaoOrderPayload = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  amountToCollect: number;
  itemDescription: string;
  orderNumber: string;
};

export type PathaoOrderResult = {
  success: boolean;
  trackingId?: string;
  message: string;
};

export async function createPathaoOrder(
  payload: PathaoOrderPayload
): Promise<PathaoOrderResult> {
  const clientId = process.env.PATHAO_CLIENT_ID;
  const clientSecret = process.env.PATHAO_CLIENT_SECRET;
  const storeId = process.env.PATHAO_STORE_ID;

  if (!clientId || !clientSecret || !storeId) {
    return {
      success: true,
      trackingId: `MOCK-${payload.orderNumber}`,
      message:
        "Pathao credentials not configured. Mock tracking ID created. Set PATHAO_CLIENT_ID, PATHAO_CLIENT_SECRET, PATHAO_STORE_ID in .env for live integration.",
    };
  }

  // TODO: Replace with real Pathao Merchant API when credentials are available.
  // Docs: https://merchant.pathao.com/api
  try {
    const response = await fetch("https://api-hermes.pathao.com/aladdin/api/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientSecret}`,
      },
      body: JSON.stringify({
        store_id: storeId,
        recipient_name: payload.customerName,
        recipient_phone: payload.customerPhone,
        recipient_address: payload.customerAddress,
        recipient_city: payload.customerCity,
        amount_to_collect: payload.amountToCollect,
        item_type: 2,
        item_quantity: 1,
        item_weight: 0.5,
        special_instruction: payload.itemDescription,
        merchant_order_id: payload.orderNumber,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, message: `Pathao API error: ${text}` };
    }

    const data = (await response.json()) as { data?: { consignment_id?: string } };
    return {
      success: true,
      trackingId: data.data?.consignment_id,
      message: "Order created on Pathao",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Pathao request failed",
    };
  }
}
