"use client";

/**
 * contexts/CartContext.tsx
 *
 * Cart state managed server-side via /api/cart (Supabase-backed).
 * Reads/writes are gated on the signed-in Firebase user's uid.
 *
 * Exposes:
 *   items          – CartItem[]  (includes local product meta)
 *   itemCount      – total number of units across all items
 *   subtotal       – sum of (price × quantity) for all items
 *   loading        – true while the initial fetch is in flight
 *   isOpen         – cart drawer visibility
 *   openCart()
 *   closeCart()
 *   addToCart(productId, quantity, meta?)
 *   updateQuantity(itemId, quantity)
 *   removeFromCart(itemId)
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductMeta {
  name:   string;
  price:  number;
  image?: string;
}

export interface CartItem {
  id:         string;   // cart_items PK
  product_id: string;
  quantity:   number;
  name:       string;
  price:      number;
  image?:     string;
}

interface CartContextType {
  items:          CartItem[];
  itemCount:      number;
  subtotal:       number;
  loading:        boolean;
  isOpen:         boolean;
  openCart:       () => void;
  closeCart:      () => void;
  addToCart:      (productId: string, quantity: number, meta?: ProductMeta) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [items,   setItems]   = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen,  setIsOpen]  = useState(false);

  /**
   * Local product-meta cache: product_id → { name, price, image }
   * Populated whenever addToCart is called with metadata.
   * Used to enrich items coming back from the API which only carry product_id.
   */
  const metaCache = useRef<Record<string, ProductMeta>>({});

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Merge API row with local meta cache */
  function enrichItem(row: {
    id:          string;
    product_id:  string;
    quantity:    number;
    name?:       string;
    price?:      number;
    image_url?:  string;
  }): CartItem {
    const meta = metaCache.current[row.product_id];
    return {
      id:         row.id,
      product_id: row.product_id,
      quantity:   row.quantity,
      name:       row.name ?? meta?.name  ?? row.product_id,
      price:      row.price ?? meta?.price ?? 0,
      image:      row.image_url ?? meta?.image,
    };
  }

  // ── Load cart from API ───────────────────────────────────────────────────

  async function loadCart(uid: string) {
    setLoading(true);
    try {
      const res  = await fetch(`/api/cart?user_id=${encodeURIComponent(uid)}`);
      const json = await res.json();
      if (json.success) {
        setItems((json.data as { id: string; product_id: string; quantity: number }[])
          .map(enrichItem));
      }
    } catch (e) {
      console.error("[CartContext] loadCart error:", e);
    } finally {
      setLoading(false);
    }
  }

  // Reload whenever the signed-in user changes
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadCart(user.uid);
    } else {
      setItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Actions ──────────────────────────────────────────────────────────────

  async function updateQuantity(itemId: string, quantity: number) {
    if (!user) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
    );

    const res  = await fetch("/api/cart", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id: itemId, quantity }),
    });
    const json = await res.json();
    if (!json.success) {
      // Roll back on failure
      await loadCart(user.uid);
      throw new Error(json.error);
    }
  }

  async function addToCart(productId: string, quantity: number, meta?: ProductMeta) {
    if (!user) throw new Error("NOT_SIGNED_IN");

    // Cache meta so the item renders properly after server round-trip
    if (meta) {
      metaCache.current[productId] = meta;
    }

    // Optimistic: if item already exists locally, just bump quantity
    const existing = items.find((i) => i.product_id === productId);
    if (existing) {
      await updateQuantity(existing.id, existing.quantity + quantity);
      return;
    }

    const res  = await fetch("/api/cart", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ user_id: user.uid, product_id: productId, quantity }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    setItems((prev) => [...prev, enrichItem(json.data)]);
  }

  async function removeFromCart(itemId: string) {
    if (!user) return;

    // Optimistic removal
    setItems((prev) => prev.filter((i) => i.id !== itemId));

    const res  = await fetch("/api/cart", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id: itemId }),
    });
    const json = await res.json();
    if (!json.success) {
      await loadCart(user.uid);
      throw new Error(json.error);
    }
  }

  // ── Computed ─────────────────────────────────────────────────────────────

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  // ── Context value ────────────────────────────────────────────────────────

  const value: CartContextType = {
    items,
    itemCount,
    subtotal,
    loading,
    isOpen,
    openCart:       () => setIsOpen(true),
    closeCart:      () => setIsOpen(false),
    addToCart,
    updateQuantity,
    removeFromCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
