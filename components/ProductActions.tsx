"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";

interface ProductActionsProps {
  productName: string;
}

export default function ProductActions({ productName }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);

  const decrement = () => setQuantity((q) => Math.max(1, q - 1));
  const increment = () => setQuantity((q) => Math.min(99, q + 1));

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
            disabled={quantity <= 1}
            className="
              flex h-11 w-11 items-center justify-center
              text-foreground
              transition-colors duration-150
              hover:bg-border
              disabled:cursor-not-allowed disabled:text-muted
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
            disabled={quantity >= 99}
            className="
              flex h-11 w-11 items-center justify-center
              text-foreground
              transition-colors duration-150
              hover:bg-border
              disabled:cursor-not-allowed disabled:text-muted
            "
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Add to Cart */}
      <button
        id="add-to-cart"
        type="button"
        aria-label={`Add ${quantity} × ${productName} to cart`}
        className="
          group flex w-full items-center justify-center gap-3
          rounded-2xl bg-accent px-8 py-4
          text-base font-semibold text-primary-foreground
          shadow-lg shadow-accent/25
          transition-all duration-200
          hover:brightness-110 hover:shadow-xl hover:shadow-accent/35 hover:-translate-y-0.5
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
          active:translate-y-0
        "
      >
        <ShoppingCart
          size={20}
          className="transition-transform duration-200 group-hover:scale-110"
        />
        Add to Cart
      </button>
    </div>
  );
}
