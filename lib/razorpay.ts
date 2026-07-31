/**
 * lib/razorpay.ts
 *
 * Server-only Razorpay client — DO NOT import in any client component.
 * The key_secret is never exposed to the browser.
 *
 * Required env vars in .env.local (never prefixed with NEXT_PUBLIC_):
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 */

import Razorpay from "razorpay";

const keyId     = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error(
    "[razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET. " +
    "Add them to .env.local and restart the dev server."
  );
}

/**
 * Singleton Razorpay instance.
 * Import this in server-only code (API routes, Server Actions).
 */
export const razorpay = new Razorpay({
  key_id:     keyId,
  key_secret: keySecret,
});
