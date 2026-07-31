"use client";

import { useEffect, useState } from "react";
import {
  ShoppingBag,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

interface OrderItem {
  id:         string;
  product_id: string;
  quantity:   number;
  price:      number;
  products?: {
    name: string;
  } | null;
}

interface Order {
  id:                   string;
  user_id:              string;
  status:               string;
  total_amount:         number;
  shipping_name:        string;
  shipping_address:     string;
  shipping_city:        string;
  shipping_postal_code: string;
  shipping_phone:       string;
  razorpay_order_id:   string | null;
  razorpay_payment_id: string | null;
  created_at:          string;
  order_items:         OrderItem[];
}

const STATUS_OPTIONS = ["all", "pending", "paid", "shipped", "delivered", "failed", "refunded"];

const STATUS_STYLES: Record<string, { label: string; text: string; bg: string; border: string }> = {
  pending: {
    label:  "Pending",
    text:   "text-amber-700 dark:text-amber-400",
    bg:     "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200/50 dark:border-amber-900/25",
  },
  paid: {
    label:  "Paid",
    text:   "text-emerald-700 dark:text-emerald-400",
    bg:     "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200/50 dark:border-emerald-900/25",
  },
  shipped: {
    label:  "Shipped",
    text:   "text-blue-700 dark:text-blue-400",
    bg:     "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200/50 dark:border-blue-900/25",
  },
  delivered: {
    label:  "Delivered",
    text:   "text-green-700 dark:text-green-400",
    bg:     "bg-green-50 dark:bg-green-950/20",
    border: "border-green-200/50 dark:border-green-900/25",
  },
  failed: {
    label:  "Failed",
    text:   "text-red-700 dark:text-red-400",
    bg:     "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200/50 dark:border-red-900/25",
  },
  refunded: {
    label:  "Refunded",
    text:   "text-zinc-700 dark:text-zinc-400",
    bg:     "bg-zinc-50 dark:bg-zinc-950/20",
    border: "border-zinc-200/50 dark:border-zinc-900/25",
  },
};

export default function AdminOrdersPage() {
  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Expanded detail panels mapping orderId -> boolean
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Feedback notifications
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);
  const [updatingId, setUpdatingId]   = useState<string | null>(null);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch orders.");
      setOrders(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Toggle order items drawer inline
  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Inline status updater
  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update order status.");
      
      triggerSuccess("Order status updated successfully!");
      // Update local state directly
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-IN", {
      day:   "numeric",
      month: "short",
      year:  "numeric",
    });
  };

  // Apply filters
  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "all") return true;
    return o.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Toast */}
      {successMsg && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-3 duration-250">
          <CheckCircle2 size={18} />
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Order Registry
          </h1>
          <p className="text-sm text-secondary mt-1">
            Manage customer transactions, tracking status, and details.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 bg-surface border border-border rounded-2xl p-1.5 self-start md:self-auto shadow-sm">
          <SlidersHorizontal size={14} className="text-muted ml-1.5 shrink-0" />
          <select
            id="admin-order-filter"
            aria-label="Filter orders by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cursor-pointer appearance-none bg-transparent pr-8 pl-1.5 text-xs font-bold uppercase tracking-wider text-foreground outline-none border-none ring-0"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="bg-surface text-foreground font-semibold">
                {opt === "all" ? "All Orders" : opt.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex h-60 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-accent" />
            <p className="text-sm text-muted">Retrieving order registry...</p>
          </div>
        </div>
      )}

      {/* Errors */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center gap-3 border border-border bg-surface rounded-2xl p-12 text-center">
          <AlertCircle size={40} className="text-muted" />
          <p className="text-base font-semibold text-foreground">Registry Unavailable</p>
          <p className="text-sm text-secondary max-w-sm">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 border border-border bg-surface rounded-2xl py-20 text-center">
          <ShoppingBag size={44} className="text-muted" />
          <p className="text-base font-semibold text-foreground">No orders matched</p>
          <p className="text-sm text-secondary">Try adjusting your status filter selection.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/50 text-xs font-bold uppercase tracking-wider text-muted">
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredOrders.map((order) => {
                  const isExpanded = !!expandedOrders[order.id];
                  const st = STATUS_STYLES[order.status] ?? {
                    label: order.status,
                    text: "text-muted",
                    bg: "bg-muted/10",
                    border: "border-border",
                  };

                  return (
                    <>
                      {/* Order Row */}
                      <tr key={order.id} className="hover:bg-background/10 transition-colors">
                        {/* Customer Info */}
                        <td className="px-5 py-4">
                          <div className="font-semibold text-foreground">{order.shipping_name}</div>
                          <div className="text-xs text-muted font-mono mt-0.5 max-w-[150px] truncate">
                            {order.id}
                          </div>
                        </td>
                        {/* Date */}
                        <td className="px-5 py-4 whitespace-nowrap text-secondary">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-muted" />
                            {formatDate(order.created_at)}
                          </div>
                        </td>
                        {/* Total */}
                        <td className="px-5 py-4 font-mono font-bold text-foreground">
                          ${order.total_amount.toFixed(2)}
                        </td>
                        {/* Inline Status Selector */}
                        <td className="px-5 py-4">
                          <div className="relative inline-flex items-center">
                            {updatingId === order.id ? (
                              <Loader2 size={16} className="animate-spin text-accent mr-2" />
                            ) : null}
                            <select
                              id={`order-status-${order.id}`}
                              aria-label={`Update status of order ${order.id}`}
                              value={order.status}
                              disabled={updatingId === order.id}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className={`
                                cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold outline-none ring-0 transition
                                ${st.bg} ${st.text} ${st.border} focus:ring-1 focus:ring-accent/40
                              `}
                            >
                              <option value="pending" className="bg-surface text-foreground font-semibold">Pending</option>
                              <option value="paid" className="bg-surface text-foreground font-semibold">Paid</option>
                              <option value="shipped" className="bg-surface text-foreground font-semibold">Shipped</option>
                              <option value="delivered" className="bg-surface text-foreground font-semibold">Delivered</option>
                              <option value="failed" className="bg-surface text-foreground font-semibold">Failed</option>
                              <option value="refunded" className="bg-surface text-foreground font-semibold">Refunded</option>
                            </select>
                          </div>
                        </td>
                        {/* Actions / Detail Toggle */}
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => toggleExpand(order.id)}
                            aria-expanded={isExpanded}
                            aria-label={`${isExpanded ? "Collapse" : "Expand"} details for order ${order.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-accent/80 transition-colors"
                          >
                            {order.order_items.length} {order.order_items.length === 1 ? "Item" : "Items"}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details Section */}
                      {isExpanded && (
                        <tr key={`${order.id}-details`}>
                          <td colSpan={5} className="bg-muted/10 px-5 py-4 border-b border-border">
                            <div className="rounded-xl border border-border bg-background p-4 shadow-inner">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
                                <ShoppingBag size={14} />
                                Purchase Details & Shipping
                              </h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Items List */}
                                <div>
                                  <h4 className="text-xs font-semibold text-secondary mb-2">Items Bought</h4>
                                  <ul className="divide-y divide-border text-xs">
                                    {order.order_items.map((item) => (
                                      <li key={item.id} className="flex justify-between py-2">
                                        <div className="font-semibold text-foreground">
                                          {item.products?.name ?? "Unknown Product"} 
                                          <span className="text-muted ml-1.5">× {item.quantity}</span>
                                        </div>
                                        <div className="font-mono font-semibold text-foreground">
                                          ${(item.price * item.quantity).toFixed(2)}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Address Block */}
                                <div className="text-xs leading-relaxed text-secondary border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                                  <h4 className="text-xs font-semibold text-secondary mb-2">Shipping Information</h4>
                                  <div className="font-semibold text-foreground">{order.shipping_name}</div>
                                  <div>{order.shipping_address}</div>
                                  <div>{order.shipping_city}</div>
                                  <div className="font-mono text-muted mt-1">{order.shipping_phone}</div>
                                  
                                  {/* Payment Identifiers */}
                                  {(order.razorpay_order_id || order.razorpay_payment_id) && (
                                    <div className="border-t border-border mt-3 pt-3 font-mono text-[10px] text-muted space-y-0.5">
                                      {order.razorpay_order_id && (
                                        <div>RZP Order: {order.razorpay_order_id}</div>
                                      )}
                                      {order.razorpay_payment_id && (
                                        <div>RZP Payment: {order.razorpay_payment_id}</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
