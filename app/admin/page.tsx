"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Package,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface DashboardStats {
  totalOrders:    number;
  pendingOrders:  number;
  paidOrders:     number;
  totalProducts:  number;
}

export default function AdminPage() {
  const [stats, setStats]     = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch total products count
      const productsRes = await supabase
        .from("products")
        .select("id", { count: "exact", head: true });

      if (productsRes.error) throw new Error(productsRes.error.message);

      // 2. Fetch total orders count
      const ordersRes = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true });

      if (ordersRes.error) throw new Error(ordersRes.error.message);

      // 3. Fetch pending orders count
      const pendingRes = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

      if (pendingRes.error) throw new Error(pendingRes.error.message);

      // 4. Fetch paid orders count
      const paidRes = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "paid");

      if (paidRes.error) throw new Error(paidRes.error.message);

      setStats({
        totalProducts:  productsRes.count ?? 0,
        totalOrders:    ordersRes.count ?? 0,
        pendingOrders:  pendingRes.count ?? 0,
        paidOrders:     paidRes.count ?? 0,
      });
    } catch (err) {
      console.error("[AdminDashboard] Error loading dashboard metrics:", err);
      setError(err instanceof Error ? err.message : "Failed to load database stats.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="border-b border-border pb-6 mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Dashboard Summary
        </h1>
        <p className="text-sm text-secondary mt-1">
          Real-time metrics from the database store.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-accent" />
            <p className="text-sm text-muted">Retrieving metrics...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center gap-3 border border-red-200/50 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10 rounded-2xl p-8 text-center">
          <AlertTriangle size={32} className="text-error" />
          <p className="text-sm font-semibold text-foreground">Database Error</p>
          <p className="text-xs text-secondary max-w-md">{error}</p>
          <button
            onClick={fetchStats}
            className="
              inline-flex items-center gap-2 mt-2
              rounded-xl bg-primary px-4 py-2
              text-xs font-semibold text-primary-foreground
              transition hover:brightness-110
            "
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards Display */}
      {stats && !loading && !error && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Orders",
              value: stats.totalOrders.toLocaleString(),
              icon:  ShoppingBag,
              color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/25",
            },
            {
              label: "Pending Orders",
              value: stats.pendingOrders.toLocaleString(),
              icon:  Clock,
              color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/25",
            },
            {
              label: "Paid Orders",
              value: stats.paidOrders.toLocaleString(),
              icon:  CheckCircle2,
              color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/25",
            },
            {
              label: "Total Products",
              value: stats.totalProducts.toLocaleString(),
              icon:  Package,
              color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/25",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`
                  flex items-center gap-4 rounded-2xl border bg-surface p-6 shadow-sm
                  transition hover:shadow duration-200 ${card.color}
                `}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-inner">
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">
                    {card.label}
                  </p>
                  <p className="text-2xl font-black text-foreground mt-1 tabular-nums">
                    {card.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
