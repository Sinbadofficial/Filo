export type BkashVerifyResult = {
  verified: boolean;
  trxId?: string;
  amount?: number;
  message: string;
};

export async function verifyBkashTransaction(
  trxId: string,
  expectedAmount?: number
): Promise<BkashVerifyResult> {
  const appKey = process.env.BKASH_APP_KEY;
  const appSecret = process.env.BKASH_APP_SECRET;
  const username = process.env.BKASH_USERNAME;
  const password = process.env.BKASH_PASSWORD;

  if (!appKey || !appSecret || !username || !password) {
    if (trxId.startsWith("MOCK") || trxId.length >= 8) {
      return {
        verified: true,
        trxId,
        amount: expectedAmount,
        message: "bKash credentials not configured — mock verification passed for development.",
      };
    }
    return {
      verified: false,
      message: "bKash credentials not configured. Set BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD.",
    };
  }

  try {
    const tokenRes = await fetch(
      `${process.env.BKASH_BASE_URL || "https://tokenized.pay.bka.sh/v1.2.0-beta"}/tokenized/checkout/token/grant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username,
          password,
        },
        body: JSON.stringify({ app_key: appKey, app_secret: appSecret }),
      }
    );

    if (!tokenRes.ok) {
      return { verified: false, message: "Failed to get bKash token" };
    }

    const tokenData = (await tokenRes.json()) as { id_token?: string };
    if (!tokenData.id_token) {
      return { verified: false, message: "Invalid bKash token response" };
    }

    const verifyRes = await fetch(
      `${process.env.BKASH_BASE_URL || "https://tokenized.pay.bka.sh/v1.2.0-beta"}/tokenized/checkout/payment/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: tokenData.id_token,
          "X-APP-Key": appKey,
        },
        body: JSON.stringify({ trxID: trxId }),
      }
    );

    if (!verifyRes.ok) {
      return { verified: false, message: "bKash transaction not found" };
    }

    const payment = (await verifyRes.json()) as {
      transactionStatus?: string;
      amount?: string;
      trxID?: string;
    };

    const verified = payment.transactionStatus === "Completed";
    const amount = payment.amount ? parseFloat(payment.amount) : undefined;

    if (verified && expectedAmount && amount && Math.abs(amount - expectedAmount) > 0.01) {
      return {
        verified: false,
        trxId,
        amount,
        message: `Amount mismatch: expected ${expectedAmount}, got ${amount}`,
      };
    }

    return {
      verified,
      trxId: payment.trxID || trxId,
      amount,
      message: verified ? "bKash payment verified" : `Status: ${payment.transactionStatus}`,
    };
  } catch (error) {
    return {
      verified: false,
      message: error instanceof Error ? error.message : "bKash verification failed",
    };
  }
}
