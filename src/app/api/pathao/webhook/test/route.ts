import { NextResponse } from "next/server";
import { z } from "zod";
import { processPathaoWebhook } from "@/lib/pathao-webhook";

const schema = z.object({
  event: z.string(),
  consignment_id: z.string().optional(),
  merchant_order_id: z.string().optional(),
  collected_amount: z.number().optional(),
  reason: z.string().optional(),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const body = schema.parse(await request.json());
    const result = await processPathaoWebhook(body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
