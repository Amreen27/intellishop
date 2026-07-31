/**
 * app/order-confirmation/[id]/page.tsx
 *
 * Server component: fetches the order from the order-status API and renders a
 * rich confirmation screen. Falls back gracefully when the order cannot be
 * fetched (e.g. the user navigated here directly with an invalid id).
 */

import Link from "next/link";
import {
  CheckCircle2,
  ShoppingBag,
  Home,
  Package,
  ArrowRight,
  Clock,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Data fetching
// ─────────────────────────────────────────────────────────────────────────────

interface OrderRow {
  id:                    string;
  status:                string;
  total_amount:          number;
  created_at:            string;
  shipping_full_name:    string;
  shipping_address_line1: string;
  shipping_address_line2?: string | null;
  shipping_city:         string;
  shipping_state?:       string | null;
  shipping_postal_code:  string;
  shipping_country:      string;
}

async function fetchOrder(id: string): Promise<OrderRow | null> {
  try {
    // Reuse the order-status route which reads from the orders table.
    // For the confirmation page we need more fields, so read directly from
    // Supabase here (server-side, service role key available).
    const { createClient } = await import("@supabase/supabase-js");

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) return null;

    const supabase = createClient(url, key);

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, status, total_amount, created_at, " +
        "shipping_full_name, shipping_address_line1, shipping_address_line2, " +
        "shipping_city, shipping_state, shipping_postal_code, shipping_country"
      )
      .eq("id", id)
      .single();

    if (error) return null;
    return data as unknown as OrderRow;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day:   "numeric",
    month: "long",
    year:  "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: {
      label: "Pending",
      cls:   "bg-muted/20 text-secondary",
    },
    paid: {
      label: "Paid",
      cls:   "bg-success/10 text-success",
    },
    failed: {
      label: "Failed",
      cls:   "bg-error/10 text-error",
    },
    refunded: {
      label: "Refunded",
      cls:   "bg-muted/20 text-secondary",
    },
  };
  const entry = map[status] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    cls:   "bg-muted/20 text-secondary",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${entry.cls}`}
    >
      {entry.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order  = await fetchOrder(id);

  // ── Unknown / invalid order ID ───────────────────────────────────────────
  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-20">
        <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-border bg-surface p-10 shadow-lg text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
            <Package className="h-8 w-8 text-muted" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Order Not Found</h1>
            <p className="mt-2 text-sm text-secondary">
              We could not find an order with ID{" "}
              <code className="rounded bg-border px-1 py-0.5 text-xs font-mono text-foreground">
                {id}
              </code>
              .
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Confirmed order ───────────────────────────────────────────────────────

  const shippingLine2 = [
    order.shipping_city,
    order.shipping_state,
    order.shipping_postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">

        {/* ── Success header ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Order Confirmed!
            </h1>
            <p className="mt-2 text-base text-secondary">
              Thank you for your purchase. We&apos;ll get your items ready soon.
            </p>
          </div>
        </div>

        {/* ── Order details card ────────────────────────────────────────── */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">

          {/* Card header */}
          <div className="flex items-center justify-between border-b border-border bg-background/50 px-6 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShoppingBag className="h-4 w-4 text-accent" aria-hidden="true" />
              Order Summary
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Order metadata grid */}
          <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">

            {/* Order ID */}
            <div className="flex flex-col gap-0.5 px-6 py-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Order ID
              </span>
              <span className="mt-1 font-mono text-sm font-semibold text-foreground break-all">
                {order.id}
              </span>
            </div>

            {/* Date placed */}
            <div className="flex flex-col gap-0.5 px-6 py-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Date Placed
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
                <Clock className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                {formatDate(order.created_at)}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between border-t border-border px-6 py-5">
            <span className="text-sm font-semibold text-foreground">Order Total</span>
            <span className="text-xl font-bold text-accent">
              ${order.total_amount.toFixed(2)}
            </span>
          </div>

          {/* Shipping address */}
          <div className="border-t border-border px-6 py-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Shipping Address
            </p>
            <address className="not-italic text-sm text-foreground leading-relaxed">
              <span className="font-semibold">{order.shipping_full_name}</span>
              <br />
              {order.shipping_address_line1}
              {order.shipping_address_line2 && (
                <>
                  <br />
                  {order.shipping_address_line2}
                </>
              )}
              <br />
              {shippingLine2}
              {order.shipping_country && (
                <>
                  <br />
                  {order.shipping_country}
                </>
              )}
            </address>
          </div>
        </div>

        {/* ── What's next ────────────────────────────────────────────────── */}
        <div className="mt-8 rounded-2xl border border-border bg-surface px-6 py-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
            What&apos;s next
          </h2>
          <ol className="flex flex-col gap-3">
            {[
              "Order confirmed and logged in our system.",
              "We'll prepare and pack your items.",
              "Your order will be dispatched shortly.",
              "You'll receive a delivery notification by email.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-secondary">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* ── CTAs ─────────────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/products"
            id="confirmation-continue-shopping"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-opacity hover:opacity-90"
          >
            Continue Shopping
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/"
            id="confirmation-go-home"
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-border"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}
