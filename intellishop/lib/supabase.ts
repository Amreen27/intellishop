/**
 * lib/supabase.ts
 *
 * Supabase browser/server client — public/anon key ONLY.
 * Never import or use the service-role key here.
 *
 * Required env vars in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Add them to .env.local and restart the dev server."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnon);

// ─── Typed helpers (optional but convenient) ──────────────────────────────────

export type Product = {
  id:          string;
  name:        string;
  description: string;
  price:       number;
  image_url:   string;
  category:    string;
  stock:       number;
  slug:        string;
  created_at:  string;
};

export type CartItem = {
  id:         string;
  user_id:    string;
  product_id: string;
  quantity:   number;
  created_at: string;
};

export type Order = {
  id:                  string;
  user_id:             string;
  status:              string;
  total_amount:        number;
  shipping_name:       string;
  shipping_address:    string;
  shipping_city:       string;
  shipping_postal_code:string;
  shipping_phone:      string;
  razorpay_order_id:   string | null;
  razorpay_payment_id: string | null;
  created_at:          string;
};

export type OrderItem = {
  id:         string;
  order_id:   string;
  product_id: string;
  quantity:   number;
  price:      number;
};
