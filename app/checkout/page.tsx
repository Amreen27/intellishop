"use client";

/**
 * app/checkout/page.tsx
 *
 * Flow:
 *  1. User fills billing form and clicks "Pay Now".
 *  2. POST /api/orders            → create Supabase order row, get back our internal order id.
 *  3. POST /api/create-razorpay-order → create Razorpay order, get razorpay_order_id + amount.
 *  4. Dynamically load the Razorpay Checkout script and open the payment popup.
 *  5a. On payment success → POST /api/verify-razorpay-payment with the three Razorpay tokens.
 *      - Verified OK  → show success screen, then redirect to /order-confirmation/[id].
 *      - Verified FAIL → show verify-error screen with a "Try Again" button.
 *  5b. On popup dismiss (user closed / payment failed inside Razorpay):
 *      - GET /api/order-status/[id] to confirm order is still "pending".
 *      - If pending   → show payment-incomplete screen with a "Retry Payment" button
 *                       that reopens the SAME Razorpay popup (same order id).
 *      - Otherwise    → show verify-error screen.
 *
 * A themed spinner overlay is shown while the popup loads or payment is being verified.
 */

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  ShoppingBag,
  ChevronRight,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

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

type FormErrors = Partial<Record<keyof FormValues, string>>;

type CheckoutStep =
  | "idle"
  | "creating-order"
  | "loading-popup"
  | "verifying"
  | "checking-status"
  | "success"
  | "payment-incomplete"
  | "verify-error";

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
  const [verifyErrorMsg, setVerifyErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState<FormValues>({
    name: user?.displayName ?? "",
    email: user?.email ?? "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  // Refs so the Razorpay callbacks (closures) can always read the latest values
  // and so we can reopen the same popup without creating a new Razorpay order.
  const internalOrderIdRef = useRef<string | null>(null);
  const rzpOptionsRef      = useRef<RazorpayOptions | null>(null);

  // ── Form helpers ────────────────────────────────────────────────────────

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear the error for this field as the user types
    if (errors[name as keyof FormValues]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  // ── Validation ──────────────────────────────────────────────────────────

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.name.trim())    errs.name    = "Full name is required.";
    if (!form.email.trim())   errs.email   = "Email address is required.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
                              errs.email   = "Enter a valid email address.";
    if (!form.phone.trim())   errs.phone   = "Phone number is required.";
    if (!form.address.trim()) errs.address = "Street address is required.";
    if (!form.city.trim())    errs.city    = "City is required.";
    if (!form.pincode.trim()) errs.pincode = "Postal code is required.";
    else if (!/^\d{4,10}$/.test(form.pincode.trim()))
                              errs.pincode = "Enter a valid postal code (digits only).";
    return errs;
  }

  // ── Reopen the same Razorpay popup (used by "Retry Payment" button) ─────

  function reopenPopup() {
    if (!rzpOptionsRef.current) return;
    setVerifyErrorMsg(null);
    setStep("idle");
    const rzp = new window.Razorpay(rzpOptionsRef.current);
    rzp.open();
  }

  // ── Checkout flow ────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setVerifyErrorMsg(null);

    // ── Client-side validation ───────────────────────────────────────────
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll the first errored field into view
      const firstKey = Object.keys(validationErrors)[0] as keyof FormValues;
      document.getElementById(`checkout-${firstKey}`)?.focus();
      return;
    }

    if (items.length === 0) {
      setVerifyErrorMsg("Your cart is empty.");
      return;
    }

    try {
      // ── Step 1: Create our Supabase order ────────────────────────────────
      setStep("creating-order");

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.uid ?? "",
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity:   i.quantity,
            price:      i.price,
            name:       i.name,
          })),
          shipping_details: {
            full_name:     form.name,
            address_line1: form.address,
            city:          form.city,
            postal_code:   form.pincode,
            country:       "IN",
            phone:         form.phone,
          },
        }),
      });

      const orderJson = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderJson.error ?? "Failed to create order");
      }

      const internalOrderId: string = orderJson.data?.order_id ?? orderJson.id;
      internalOrderIdRef.current = internalOrderId;

      // ── Step 2: Create Razorpay order ────────────────────────────────────
      const rzpOrderRes = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: internalOrderId,
        }),
      });

      const rzpOrderJson = await rzpOrderRes.json();
      if (!rzpOrderRes.ok) {
        throw new Error(rzpOrderJson.error ?? "Failed to create Razorpay order");
      }

      const { id: razorpayOrderId, amount: razorpayAmount } = rzpOrderJson;

      // ── Step 3: Load script and build options (save to ref for retry) ────
      setStep("loading-popup");
      await loadRazorpayScript();

      const rzpOptions: RazorpayOptions = {
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
        theme: { color: "var(--color-accent)" },

        // ── On payment success → verify ───────────────────────────────────
        handler: async (response: RazorpayResponse) => {
          setStep("verifying");
          try {
            const verifyRes = await fetch("/api/verify-razorpay-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id:  response.razorpay_order_id || razorpayOrderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                internal_order_id:   internalOrderIdRef.current,
              }),
            });

            const verifyJson = await verifyRes.json();

            if (!verifyRes.ok) {
              // Verification failed — show error screen
              setVerifyErrorMsg(
                verifyJson.error ?? "Payment verification failed. Please contact support."
              );
              setStep("verify-error");
              return;
            }

            // ✅ Verified — show brief success screen then redirect
            setStep("success");
            setTimeout(() => {
              router.push(`/order-confirmation/${internalOrderIdRef.current}`);
            }, 1800);
          } catch (err) {
            setVerifyErrorMsg(
              err instanceof Error ? err.message : "Verification failed. Please contact support."
            );
            setStep("verify-error");
          }
        },

        // ── On popup dismiss (closed / payment failed inside Razorpay) ────
        modal: {
          ondismiss: async () => {
            setStep("checking-status");
            try {
              const statusRes = await fetch(
                `/api/order-status/${internalOrderIdRef.current}`
              );
              const statusJson = await statusRes.json();
              // If the order is still pending the payment was not captured.
              if (statusJson?.status === "pending") {
                setStep("payment-incomplete");
              } else {
                // Unexpected non-pending status after dismiss — treat as error.
                setVerifyErrorMsg(
                  "Your payment could not be confirmed. Please contact support."
                );
                setStep("verify-error");
              }
            } catch {
              // Network error while checking — safe fallback: show incomplete.
              setStep("payment-incomplete");
            }
          },
        },
      };

      // Save options so reopenPopup() can create a fresh instance later
      rzpOptionsRef.current = rzpOptions;

      const rzp = new window.Razorpay(rzpOptions);
      rzp.open();
      // Popup is now visible; clear the loading overlay
      setStep("idle");
    } catch (err) {
      setVerifyErrorMsg(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setStep("verify-error");
    }
  }

  // ── Derived state ───────────────────────────────────────────────────────

  const overlaySteps: CheckoutStep[] = [
    "creating-order",
    "loading-popup",
    "verifying",
    "checking-status",
  ];
  const isBusy   = overlaySteps.includes(step);
  const isFinale = ["success", "payment-incomplete", "verify-error"].includes(step);

  const stepLabel: Record<CheckoutStep, string> = {
    idle:               "",
    "creating-order":   "Creating your order…",
    "loading-popup":    "Preparing secure payment…",
    verifying:          "Verifying payment…",
    "checking-status":  "Checking order status…",
    success:            "",
    "payment-incomplete": "",
    "verify-error":     "",
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-background">

      {/* ── Spinner overlay (creating order / loading popup / verifying / checking status) ── */}
      {isBusy && (
        <div
          role="status"
          aria-live="polite"
          aria-label={stepLabel[step]}
          className="
            fixed inset-0 z-50 flex flex-col items-center justify-center
            bg-primary/80 backdrop-blur-sm
          "
        >
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface px-10 py-9 shadow-2xl">
            <Loader2 size={44} className="animate-spin text-accent" aria-hidden="true" />
            <p className="text-base font-semibold text-foreground">{stepLabel[step]}</p>
            <p className="text-sm text-muted">Please don&apos;t close this window.</p>
          </div>
        </div>
      )}

      {/* ── SUCCESS screen ───────────────────────────────────────────────── */}
      {step === "success" && (
        <div
          role="status"
          aria-live="assertive"
          className="
            fixed inset-0 z-50 flex flex-col items-center justify-center
            bg-primary/85 backdrop-blur-sm
          "
        >
          <div className="flex flex-col items-center gap-5 rounded-2xl bg-surface px-12 py-10 shadow-2xl text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 size={40} className="text-success" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">Payment Successful!</p>
              <p className="mt-1 text-sm text-muted">Redirecting to your order…</p>
            </div>
            <Loader2 size={20} className="animate-spin text-muted" aria-hidden="true" />
          </div>
        </div>
      )}

      {/* ── PAYMENT INCOMPLETE screen (dismissed / failed inside Razorpay) ─ */}
      {step === "payment-incomplete" && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-border bg-surface p-10 shadow-lg text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
              <AlertTriangle size={36} className="text-secondary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Payment Not Completed</h2>
              <p className="mt-2 text-sm text-secondary">
                Payment was not completed. You can try again — your order is saved
                and waiting.
              </p>
            </div>
            <button
              id="checkout-retry-payment-btn"
              type="button"
              onClick={reopenPopup}
              className="
                flex items-center justify-center gap-2
                w-full rounded-2xl bg-accent px-8 py-4
                text-base font-semibold text-primary-foreground
                shadow-lg shadow-accent/25
                transition-all duration-200
                hover:brightness-110 hover:shadow-xl hover:shadow-accent/35 hover:-translate-y-0.5
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
                active:translate-y-0
              "
            >
              <RefreshCw size={18} aria-hidden="true" />
              Retry Payment
            </button>
            <button
              id="checkout-back-to-form-btn"
              type="button"
              onClick={() => setStep("idle")}
              className="text-sm text-muted underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Back to checkout form
            </button>
          </div>
        </div>
      )}

      {/* ── VERIFY ERROR screen ───────────────────────────────────────────── */}
      {step === "verify-error" && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-border bg-surface p-10 shadow-lg text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
              <XCircle size={36} className="text-error" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Payment Verification Failed</h2>
              {verifyErrorMsg && (
                <p className="mt-2 text-sm text-secondary">{verifyErrorMsg}</p>
              )}
            </div>
            {/* Offer to retry if we still have a pending Razorpay order */}
            {rzpOptionsRef.current && (
              <button
                id="checkout-try-again-btn"
                type="button"
                onClick={reopenPopup}
                className="
                  flex items-center justify-center gap-2
                  w-full rounded-2xl bg-accent px-8 py-4
                  text-base font-semibold text-primary-foreground
                  shadow-lg shadow-accent/25
                  transition-all duration-200
                  hover:brightness-110 hover:shadow-xl hover:shadow-accent/35 hover:-translate-y-0.5
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
                  active:translate-y-0
                "
              >
                <RefreshCw size={18} aria-hidden="true" />
                Try Again
              </button>
            )}
            <button
              id="checkout-back-btn"
              type="button"
              onClick={() => { setVerifyErrorMsg(null); setStep("idle"); }}
              className="text-sm text-muted underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Back to checkout form
            </button>
          </div>
        </div>
      )}

      {/* ── Normal checkout UI (hidden once a finale screen is active) ───── */}
      {!isFinale && (
        <>
          {/* ── Page header ────────────────────────────────────────────── */}
          <header className="border-b border-border bg-surface px-6 py-4 shadow-sm">
            <div className="mx-auto flex max-w-5xl items-center gap-3">
              <ShoppingBag size={22} className="text-accent" aria-hidden="true" />
              <h1 className="text-xl font-bold tracking-tight text-foreground">Checkout</h1>
              <div className="ml-auto flex items-center gap-1.5 text-sm text-muted">
                <Lock size={14} aria-hidden="true" />
                Secure checkout
              </div>
            </div>
          </header>

          {/* ── Main content ───────────────────────────────────────────── */}
          <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1fr_340px]">

            {/* ── Billing form ─────────────────────────────────────────── */}
            <section aria-labelledby="billing-heading">
              <h2 id="billing-heading" className="mb-6 text-lg font-bold text-foreground">
                Billing Details
              </h2>

              <form id="checkout-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                {/* Name */}
                <Field id="checkout-name" label="Full Name" required error={errors.name}>
                  <input
                    id="checkout-name" name="name" type="text" autoComplete="name"
                    value={form.name} onChange={handleChange}
                    placeholder="Jane Smith"
                    aria-describedby={errors.name ? "checkout-name-error" : undefined}
                    aria-invalid={!!errors.name}
                    className={errors.name ? inputErrCls : inputCls}
                  />
                </Field>

                {/* Email */}
                <Field id="checkout-email" label="Email Address" required error={errors.email}>
                  <input
                    id="checkout-email" name="email" type="email" autoComplete="email"
                    value={form.email} onChange={handleChange}
                    placeholder="jane@example.com"
                    aria-describedby={errors.email ? "checkout-email-error" : undefined}
                    aria-invalid={!!errors.email}
                    className={errors.email ? inputErrCls : inputCls}
                  />
                </Field>

                {/* Phone */}
                <Field id="checkout-phone" label="Phone Number" required error={errors.phone}>
                  <input
                    id="checkout-phone" name="phone" type="tel" autoComplete="tel"
                    value={form.phone} onChange={handleChange}
                    placeholder="+91 98765 43210"
                    aria-describedby={errors.phone ? "checkout-phone-error" : undefined}
                    aria-invalid={!!errors.phone}
                    className={errors.phone ? inputErrCls : inputCls}
                  />
                </Field>

                {/* Address */}
                <Field id="checkout-address" label="Street Address" required error={errors.address}>
                  <textarea
                    id="checkout-address" name="address" autoComplete="street-address"
                    rows={3} value={form.address} onChange={handleChange}
                    placeholder="123, Main Street, Apt 4B"
                    aria-describedby={errors.address ? "checkout-address-error" : undefined}
                    aria-invalid={!!errors.address}
                    className={`${errors.address ? inputErrCls : inputCls} resize-none`}
                  />
                </Field>

                {/* City + Pincode */}
                <div className="grid grid-cols-2 gap-4">
                  <Field id="checkout-city" label="City" required error={errors.city}>
                    <input
                      id="checkout-city" name="city" type="text" autoComplete="address-level2"
                      value={form.city} onChange={handleChange}
                      placeholder="Mumbai"
                      aria-describedby={errors.city ? "checkout-city-error" : undefined}
                      aria-invalid={!!errors.city}
                      className={errors.city ? inputErrCls : inputCls}
                    />
                  </Field>
                  <Field id="checkout-pincode" label="Pincode" required error={errors.pincode}>
                    <input
                      id="checkout-pincode" name="pincode" type="text" autoComplete="postal-code"
                      inputMode="numeric" maxLength={10}
                      value={form.pincode} onChange={handleChange}
                      placeholder="400001"
                      aria-describedby={errors.pincode ? "checkout-pincode-error" : undefined}
                      aria-invalid={!!errors.pincode}
                      className={errors.pincode ? inputErrCls : inputCls}
                    />
                  </Field>
                </div>

                {/* Submit — desktop */}
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
                  {isBusy
                    ? <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                    : <Lock size={18} aria-hidden="true" />}
                  Pay Now
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </form>
            </section>

            {/* ── Order summary ─────────────────────────────────────────── */}
            <aside aria-labelledby="order-summary-heading" className="flex flex-col gap-6">
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <h2 id="order-summary-heading" className="mb-5 text-base font-bold text-foreground">
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
                          <span className="text-sm font-medium text-foreground line-clamp-2">{item.name}</span>
                          <span className="text-xs text-muted">Qty: {item.quantity}</span>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-foreground">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                  <div className="flex justify-between text-sm text-secondary">
                    <span>Subtotal</span><span>{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-secondary">
                    <span>Shipping</span>
                    <span className="font-medium text-success">Free</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-foreground">
                    <span>Total</span><span>{formatINR(subtotal)}</span>
                  </div>
                </div>
              </div>

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
                {isBusy
                  ? <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  : <Lock size={18} aria-hidden="true" />}
                Pay Now
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </aside>
          </main>
        </>
      )}
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

const inputErrCls = `
  w-full rounded-xl border border-error bg-surface px-4 py-3
  text-sm text-foreground placeholder:text-muted
  transition-colors duration-150
  focus:border-error focus:outline-none focus:ring-2 focus:ring-error/20
`;

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
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
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-error"
        >
          <AlertCircle size={13} className="flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
