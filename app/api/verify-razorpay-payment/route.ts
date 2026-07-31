/**
 * app/api/verify-razorpay-payment/route.ts
 *
 * POST /api/verify-razorpay-payment
 *
 * Request body:
 *   {
 *     razorpay_order_id:   string,
 *     razorpay_payment_id: string,
 *     razorpay_signature:  string,
 *   }
 *
 * Steps:
 *   1. Validate the request body.
 *   2. Recompute the expected HMAC-SHA256 signature per Razorpay's spec:
 *        HMAC_SHA256( key=RAZORPAY_KEY_SECRET, data="<order_id>|<payment_id>" )
 *   3. If the signatures match:
 *        – Update the Supabase order's status → 'paid'
 *        – Store razorpay_payment_id on the order row
 *        – Return { success: true }
 *   4. If the signatures do NOT match, return 400 without touching the DB.
 */

import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// ── Env vars ──────────────────────────────────────────────────────────────────
const keySecret = process.env.RAZORPAY_KEY_SECRET;

// ── Supabase (server-side — uses service-role key when available) ──────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase env vars are not set. " +
        "Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local."
    );
  }
  return createClient(supabaseUrl, supabaseKey);
}

// ── Response helpers ──────────────────────────────────────────────────────────
function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details !== undefined && { details }),
    },
    { status }
  );
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Guard: key_secret must be set before we proceed
    if (!keySecret) {
      console.error("[verify-razorpay-payment] RAZORPAY_KEY_SECRET is not set.");
      return fail("Payment verification is not configured.", 500);
    }

    // 1. Parse & validate body
    const body = await req.json().catch(() => null);
    if (!body) return fail("Request body must be valid JSON.");

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      body as {
        razorpay_order_id?:   unknown;
        razorpay_payment_id?: unknown;
        razorpay_signature?:  unknown;
      };

    if (!razorpay_order_id   || typeof razorpay_order_id   !== "string") {
      return fail("Missing or invalid field: razorpay_order_id.");
    }
    if (!razorpay_payment_id || typeof razorpay_payment_id !== "string") {
      return fail("Missing or invalid field: razorpay_payment_id.");
    }
    if (!razorpay_signature  || typeof razorpay_signature  !== "string") {
      return fail("Missing or invalid field: razorpay_signature.");
    }

    // 2. Recompute expected signature using HMAC-SHA256
    //    Razorpay's prescribed payload: "<razorpay_order_id>|<razorpay_payment_id>"
    const payload  = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    console.log("[verify-razorpay-payment] DEBUG DETAILS:", {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payload,
      expectedSignature: expected,
      keySecretUsed: keySecret ? `${keySecret.substring(0, 4)}...` : "not_set"
    });

    // Use timing-safe comparison to prevent timing attacks
    const expectedBuf = Buffer.from(expected,            "hex");
    const receivedBuf = Buffer.from(razorpay_signature,  "hex");

    const signatureValid =
      expectedBuf.length === receivedBuf.length &&
      timingSafeEqual(expectedBuf, receivedBuf);

    // 3a. Signature mismatch — reject without touching the DB
    if (!signatureValid) {
      console.warn(
        `[verify-razorpay-payment] Signature mismatch for Razorpay order ${razorpay_order_id}`
      );
      return fail("Payment signature verification failed.", 400);
    }

    // 3b. Signature valid — update the order in Supabase
    const supabase = getClient();

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status:              "paid",
        razorpay_payment_id: razorpay_payment_id,
      })
      .eq("razorpay_order_id", razorpay_order_id);

    if (updateError) {
      console.error(
        `[verify-razorpay-payment] Failed to mark order ${razorpay_order_id} as paid:`,
        updateError
      );
      return fail("Payment verified but failed to update order status.", 500, updateError);
    }

    // 4. Return success
    return ok({ message: "Payment verified and order marked as paid." });
  } catch (err) {
    console.error("[verify-razorpay-payment] Unexpected error:", err);
    return fail("Internal server error.", 500, String(err));
  }
}
