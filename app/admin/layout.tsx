"use client";

import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/isAdmin";
import Link from "next/link";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-accent" />
          <p className="text-sm font-medium text-muted">Checking authorization…</p>
        </div>
      </div>
    );
  }

  // 2. Authorization Check
  const authorized = user && isAdmin(user.email);

  if (!authorized) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 sm:py-28">
        <div className="flex flex-col items-center text-center bg-surface border border-border rounded-3xl p-8 sm:p-10 shadow-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error mb-6">
            <ShieldAlert size={36} />
          </div>

          <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-3">
            Access Denied
          </h1>
          
          <p className="text-sm text-secondary leading-relaxed mb-8">
            You do not have the required permissions to view the administration panel. 
            If you believe this is an error, please verify your account or contact support.
          </p>

          <Link
            href="/"
            className="
              inline-flex items-center justify-center gap-2
              w-full rounded-2xl bg-primary px-6 py-3.5
              text-sm font-semibold text-primary-foreground
              shadow transition-all duration-200
              hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5
              active:translate-y-0
            "
          >
            <ArrowLeft size={16} />
            Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // 3. Render Admin Area with Navigation
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-surface sticky top-16 z-30 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="text-sm font-extrabold text-foreground tracking-tight hidden sm:inline">
                Admin Panel
              </span>
              <nav className="flex items-center gap-1 sm:gap-2">
                <Link
                  href="/admin"
                  className="text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl transition-all hover:bg-muted text-accent"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/products"
                  className="text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl transition-all hover:bg-muted text-secondary hover:text-foreground"
                >
                  Products
                </Link>
                <Link
                  href="/admin/orders"
                  className="text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl transition-all hover:bg-muted text-secondary hover:text-foreground"
                >
                  Orders
                </Link>
              </nav>
            </div>
            
            <Link
              href="/"
              className="text-xs font-semibold text-muted hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              Back to Store
              <ArrowLeft size={14} />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
