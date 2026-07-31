"use client";

/**
 * components/CartDrawer.tsx
 *
 * Slide-in cart drawer (right side). Controlled via CartContext.isOpen.
 * Mobile-first: full-width on small screens, 400 px on md+.
 */

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export default function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,
    loading,
    isOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  // Trap focus & close on Escape
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", handleKey);

    // Prevent body scroll while open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      {/* ── Drawer panel ────────────────────────────────────────────── */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="
          fixed inset-y-0 right-0 z-50 flex flex-col
          w-full max-w-full
          sm:w-[400px]
          bg-surface shadow-2xl
          animate-[slideInRight_0.25s_ease-out]
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-accent" />
            <h2 className="text-base font-semibold text-foreground">
              Your Cart
              {itemCount > 0 && (
                <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              )}
            </h2>
          </div>
          <button
            id="cart-drawer-close"
            onClick={closeCart}
            aria-label="Close cart"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-border hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            /* Loading skeleton */
            <ul className="space-y-4">
              {[1, 2, 3].map((n) => (
                <li
                  key={n}
                  className="flex gap-4 rounded-xl border border-border p-3 animate-pulse"
                >
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-border" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-3 w-3/4 rounded bg-border" />
                    <div className="h-3 w-1/4 rounded bg-border" />
                  </div>
                </li>
              ))}
            </ul>
          ) : items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
                <ShoppingBag className="h-10 w-10 text-accent" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Your cart is empty</p>
                <p className="mt-1 text-sm text-muted">
                  Browse our products and add something you love.
                </p>
              </div>
              <button
                onClick={closeCart}
                className="mt-2 rounded-full bg-accent px-6 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            /* Item list */
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-border bg-background p-3 transition-shadow hover:shadow-sm"
                >
                  {/* Image */}
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-border">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-muted" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between gap-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground leading-snug">
                      {item.name}
                    </p>
                    <p className="text-sm font-bold text-accent">
                      ${item.price.toFixed(2)}
                    </p>

                    {/* Quantity controls + remove */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1 rounded-lg border border-border bg-surface px-1 py-0.5">
                        <button
                          id={`qty-dec-${item.id}`}
                          aria-label={`Decrease quantity of ${item.name}`}
                          onClick={() =>
                            item.quantity > 1
                              ? updateQuantity(item.id, item.quantity - 1)
                              : removeFromCart(item.id)
                          }
                          className="rounded p-0.5 text-muted transition-colors hover:bg-border hover:text-foreground disabled:opacity-40"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          id={`qty-inc-${item.id}`}
                          aria-label={`Increase quantity of ${item.name}`}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="rounded p-0.5 text-muted transition-colors hover:bg-border hover:text-foreground"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        id={`remove-${item.id}`}
                        aria-label={`Remove ${item.name} from cart`}
                        onClick={() => removeFromCart(item.id)}
                        className="rounded-lg p-1.5 text-muted transition-colors hover:bg-error/10 hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer — only shown when cart has items */}
        {items.length > 0 && (
          <div className="border-t border-border px-5 py-4 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="text-lg font-bold text-foreground">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted">Shipping & taxes calculated at checkout.</p>

            {/* Checkout CTA */}
            <Link
              href="/checkout"
              onClick={closeCart}
              id="cart-checkout-btn"
              className="flex h-11 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Checkout · ${subtotal.toFixed(2)}
            </Link>

            <button
              onClick={closeCart}
              className="w-full text-center text-xs text-muted underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>

      {/* Slide-in animation keyframe */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
