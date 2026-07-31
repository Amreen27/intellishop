"use client";

/**
 * app/checkout/page.tsx
 *
 * Flow:
 *  1. User fills billing form and clicks "Pay Now".
 *  2. POST /api/orders            → create Supabase order row, get back our internal order id.
 *  3. POST /api/create-razorpay-order → create Razorpay order, get razorpay_order_id + amount.
 *  4. Dynamically load the Razorpay Checkout script and open the payment popup.
 *  5. On payment success → POST /api/verify-razorpay-payment with the three Razorpay tokens.
 *  6. Redirect to /order-confirmation/[id] on verified success.
 *
 * A themed spinner overlay is shown while the popup is being prepared.
 */

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ShoppingBag, ChevronRight, Lock } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Razorpay global type augmentation
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}

type CheckoutStep = "idle" | "creating-order" | "loading-popup" | "verifying";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Inject the Razorpay Checkout script once and resolve when ready. */
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.head.appendChild(script);
  });
}

/** Format paise → "₹X,XXX.XX" */
function formatINR(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, loading: cartLoading } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState<CheckoutStep>("idle");
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormValues>({
    name: user?.displayName ?? "",
    email: user?.email ?? "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  // Keep a ref so the Razorpay handler closure can read the latest order id
  const internalOrderIdRef = useRef<string | null>(null);

  // ── Form helpers ────────────────────────────────────────────────────────

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // ── Checkout flow ────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    try {
      // ── Step 1: Create our Supabase order ────────────────────────────────
      setStep("creating-order");

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.uid ?? null,
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            unit_price: i.price,
          })),
          total: subtotal,
          billing: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            pincode: form.pincode,
          },
        }),
      });

      const orderJson = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderJson.error ?? "Failed to create order");
      }

      const internalOrderId: string = orderJson.id ?? orderJson.data?.id;
      internalOrderIdRef.current = internalOrderId;

      // ── Step 2: Create Razorpay order ────────────────────────────────────
      const rzpOrderRes = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: subtotal,          // in paise / USD cents — matches your route
          currency: "INR",
          receipt: internalOrderId,
        }),
      });

      const rzpOrderJson = await rzpOrderRes.json();
      if (!rzpOrderRes.ok) {
        throw new Error(rzpOrderJson.error ?? "Failed to create Razorpay order");
      }

      const { id: razorpayOrderId, amount: razorpayAmount } = rzpOrderJson;

      // ── Step 3: Load script and open popup ───────────────────────────────
      setStep("loading-popup");
      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: razorpayAmount,
        currency: "INR",
        name: "IntelliShop",
        description: "Order Payment",
        image: "/favicon.ico",
        order_id: razorpayOrderId,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#2563eb" },

        // ── Step 4: On payment success → verify ──────────────────────────
        handler: async (response: RazorpayResponse) => {
          setStep("verifying");
          try {
            const verifyRes = await fetch("/api/verify-razorpay-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                internal_order_id: internalOrderIdRef.current,
              }),
            });

            const verifyJson = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyJson.error ?? "Payment verification failed");
            }

            router.push(`/order-confirmation/${internalOrderIdRef.current}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed");
            setStep("idle");
          }
        },

        modal: {
          ondismiss: () => {
            // User closed the popup without paying
            setStep("idle");
          },
        },
      });

      rzp.open();
      // After open() returns the popup is visible; reset step so the
      // overlay disappears — the popup itself is the UI from here.
      setStep("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("idle");
    }
  }

  // ── Loading overlay ─────────────────────────────────────────────────────

  const isBusy = step !== "idle";

  const stepLabel: Record<CheckoutStep, string> = {
    idle: "",
    "creating-order": "Creating your order…",
    "loading-popup": "Preparing secure payment…",
    verifying: "Verifying payment…",
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-background">

      {/* ── Loading overlay ──────────────────────────────────────────────── */}
      {isBusy && (
        <div
          role="status"
          aria-live="polite"
          aria-label={stepLabel[step]}
          className="
            fixed inset-0 z-50 flex flex-col items-center justify-center gap-4
            bg-primary/80 backdrop-blur-sm
          "
        >
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface px-10 py-9 shadow-2xl">
            <Loader2
              size={44}
              className="animate-spin text-accent"
              aria-hidden="true"
            />
            <p className="text-base font-semibold text-foreground">
              {stepLabel[step]}
            </p>
            <p className="text-sm text-muted">Please don&apos;t close this window.</p>
          </div>
        </div>
      )}

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-surface px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <ShoppingBag size={22} className="text-accent" aria-hidden="true" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Checkout
          </h1>
          <div className="ml-auto flex items-center gap-1.5 text-sm text-muted">
            <Lock size={14} aria-hidden="true" />
            Secure checkout
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1fr_340px]">

        {/* ── Billing form ─────────────────────────────────────────────── */}
        <section aria-labelledby="billing-heading">
          <h2
            id="billing-heading"
            className="mb-6 text-lg font-bold text-foreground"
          >
            Billing Details
          </h2>

          <form
            id="checkout-form"
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-5"
          >
            {/* Name */}
            <Field id="checkout-name" label="Full Name" required>
              <input
                id="checkout-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Smith"
                className={inputCls}
              />
            </Field>

            {/* Email */}
            <Field id="checkout-email" label="Email Address" required>
              <input
                id="checkout-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="jane@example.com"
                className={inputCls}
              />
            </Field>

            {/* Phone */}
            <Field id="checkout-phone" label="Phone Number" required>
              <input
                id="checkout-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className={inputCls}
              />
            </Field>

            {/* Address */}
            <Field id="checkout-address" label="Street Address" required>
              <textarea
                id="checkout-address"
                name="address"
                autoComplete="street-address"
                required
                rows={3}
                value={form.address}
                onChange={handleChange}
                placeholder="123, Main Street, Apt 4B"
                className={`${inputCls} resize-none`}
              />
            </Field>

            {/* City + Pincode row */}
            <div className="grid grid-cols-2 gap-4">
              <Field id="checkout-city" label="City" required>
                <input
                  id="checkout-city"
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  required
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  className={inputCls}
                />
              </Field>

              <Field id="checkout-pincode" label="Pincode" required>
                <input
                  id="checkout-pincode"
                  name="pincode"
                  type="text"
                  autoComplete="postal-code"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="400001"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Error banner */}
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-error/10 px-4 py-3 text-sm font-medium text-error"
              >
                {error}
              </p>
            )}

            {/* Submit — desktop (hidden on mobile, rendered below order summary) */}
            <button
              id="checkout-pay-btn"
              type="submit"
              disabled={isBusy || cartLoading}
              aria-busy={isBusy}
              className="
                hidden md:flex items-center justify-center gap-2
                rounded-2xl bg-accent px-8 py-4
                text-base font-semibold text-primary-foreground
                shadow-lg shadow-accent/25
                transition-all duration-200
                hover:brightness-110 hover:shadow-xl hover:shadow-accent/35 hover:-translate-y-0.5
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
                active:translate-y-0
                disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:brightness-100
              "
            >
              {isBusy ? (
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              ) : (
                <Lock size={18} aria-hidden="true" />
              )}
              Pay Now
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </form>
        </section>

        {/* ── Order summary ─────────────────────────────────────────────── */}
        <aside
          aria-labelledby="order-summary-heading"
          className="flex flex-col gap-6"
        >
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2
              id="order-summary-heading"
              className="mb-5 text-base font-bold text-foreground"
            >
              Order Summary
            </h2>

            {cartLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Loading cart…
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted">Your cart is empty.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border" role="list">
                {items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground line-clamp-2">
                        {item.name}
                      </span>
                      <span className="text-xs text-muted">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-foreground">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Totals */}
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm text-secondary">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-secondary">
                <span>Shipping</span>
                <span className="font-medium text-success">Free</span>
              </div>
              <div className="flex justify-between text-base font-bold text-foreground">
                <span>Total</span>
                <span>{formatINR(subtotal)}</span>
              </div>
            </div>
          </div>

          {/* Trust badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted">
            <Lock size={12} aria-hidden="true" />
            256-bit SSL encrypted &amp; secured by Razorpay
          </div>

          {/* Submit — mobile */}
          <button
            form="checkout-form"
            type="submit"
            disabled={isBusy || cartLoading}
            aria-busy={isBusy}
            className="
              flex items-center justify-center gap-2 md:hidden
              rounded-2xl bg-accent px-8 py-4
              text-base font-semibold text-primary-foreground
              shadow-lg shadow-accent/25
              transition-all duration-200
              hover:brightness-110 hover:shadow-xl hover:shadow-accent/35 hover:-translate-y-0.5
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
              active:translate-y-0
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {isBusy ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <Lock size={18} aria-hidden="true" />
            )}
            Pay Now
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </aside>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const inputCls = `
  w-full rounded-xl border border-border bg-surface px-4 py-3
  text-sm text-foreground placeholder:text-muted
  transition-colors duration-150
  focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20
`;

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <span className="ml-1 text-error" aria-hidden="true">*</span>
        )}
      </label>
      {children}
    </div>
  );
}
