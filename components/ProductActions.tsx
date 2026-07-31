"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Check, LogIn } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithGoogle } from "@/lib/firebase";

interface ProductActionsProps {
  productId:   string;
  productName: string;
  price:       number;
  imageUrl?:   string;
}

export default function ProductActions({
  productId,
  productName,
  price,
  imageUrl,
}: ProductActionsProps) {
  const { addToCart, openCart } = useCart();
  const { user }                 = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [status,   setStatus]   = useState<"idle" | "loading" | "added" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const decrement = () => setQuantity((q) => Math.max(1, q - 1));
  const increment = () => setQuantity((q) => Math.min(99, q + 1));

  async function handleAddToCart() {
    // Not signed in → prompt sign-in
    if (!user) {
      try {
        await signInWithGoogle();
      } catch {
        setErrorMsg("Sign-in was cancelled. Please try again.");
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      await addToCart(productId, quantity, {
        name:  productName,
        price,
        image: imageUrl,
      });
      setStatus("added");
      openCart();                          // slide open the cart drawer
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add to cart.";
      setErrorMsg(
        msg === "NOT_SIGNED_IN"
          ? "Please sign in to add items to your cart."
          : msg
      );
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Quantity selector */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-secondary">Quantity</label>
        <div className="inline-flex items-center gap-0 rounded-xl border border-border bg-surface overflow-hidden w-fit">
          <button
            id="qty-decrement"
            aria-label="Decrease quantity"
            onClick={decrement}
            disabled={quantity <= 1 || status === "loading"}
            className="
              flex h-11 w-11 items-center justify-center
              text-foreground transition-colors duration-150
              hover:bg-border disabled:cursor-not-allowed disabled:text-muted
            "
          >
            <Minus size={16} strokeWidth={2.5} />
          </button>

          <span
            id="qty-display"
            aria-live="polite"
            className="min-w-[2.5rem] select-none text-center text-base font-semibold text-foreground"
          >
            {quantity}
          </span>

          <button
            id="qty-increment"
            aria-label="Increase quantity"
            onClick={increment}
            disabled={quantity >= 99 || status === "loading"}
            className="
              flex h-11 w-11 items-center justify-center
              text-foreground transition-colors duration-150
              hover:bg-border disabled:cursor-not-allowed disabled:text-muted
            "
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Add to Cart button */}
      <button
        id="add-to-cart"
        type="button"
        onClick={handleAddToCart}
        disabled={status === "loading" || status === "added"}
        aria-label={
          !user
            ? "Sign in to add to cart"
            : `Add ${quantity} × ${productName} to cart`
        }
        className="
          group flex w-full items-center justify-center gap-3
          rounded-2xl bg-accent px-8 py-4
          text-base font-semibold text-primary-foreground
          shadow-lg shadow-accent/25
          transition-all duration-200
          hover:brightness-110 hover:shadow-xl hover:shadow-accent/35 hover:-translate-y-0.5
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
          active:translate-y-0
          disabled:cursor-not-allowed disabled:opacity-70
        "
      >
        {/* Icon */}
        {status === "loading" && (
          <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        )}
        {status === "added"            && <Check size={20} />}
        {status === "idle" && !user    && <LogIn size={20} />}
        {(status === "idle" && user) || status === "error" ? (
          <ShoppingCart
            size={20}
            className="transition-transform duration-200 group-hover:scale-110"
          />
        ) : null}

        {/* Label */}
        {status === "loading" && "Adding…"}
        {status === "added"   && "Added to Cart!"}
        {status === "error"   && "Add to Cart"}
        {status === "idle"    && (!user ? "Sign in to Add" : "Add to Cart")}
      </button>

      {/* Inline error */}
      {status === "error" && errorMsg && (
        <p role="alert" className="text-sm text-error text-center">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
