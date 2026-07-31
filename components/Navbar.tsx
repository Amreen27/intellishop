"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Menu, X, LogIn, LogOut, ChevronDown } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithGoogle, signOutUser } from "@/lib/firebaseClient";
import CartDrawer from "./CartDrawer";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const { itemCount, openCart } = useCart();
  const { user, loading } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignIn() {
    try {
      setAuthLoading(true);
      await signInWithGoogle();
    } catch (err) {
      console.error("Google sign-in failed:", err);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    setDropdownOpen(false);
    try {
      await signOutUser();
    } catch (err) {
      console.error("Sign-out failed:", err);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 dark:border-gray-800/80 bg-background/80 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo / Store Name */}
            <div className="flex-shrink-0">
              <Link
                href="#"
                className="text-xl font-extrabold tracking-tight text-foreground transition-opacity hover:opacity-90"
              >
                IntelliShop
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center justify-center space-x-8">
              <Link
                href="#"
                className="text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
              >
                Home
              </Link>
              <Link
                href="#"
                className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-foreground"
              >
                Products
              </Link>
            </nav>

            {/* Action Items (Auth, Cart & Hamburger) */}
            <div className="flex items-center gap-3">

              {/* ── Auth Section ── */}
              {loading ? (
                /* Skeleton while Firebase resolves the persisted session */
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              ) : user ? (
                /* ── Signed-in: avatar + dropdown ── */
                <div className="relative" ref={dropdownRef}>
                  <button
                    id="navbar-user-menu-btn"
                    type="button"
                    onClick={() => setDropdownOpen((o) => !o)}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                    className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName ?? "User avatar"}
                        width={32}
                        height={32}
                        className="rounded-full ring-2 ring-accent/40 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
                        {(user.displayName ?? user.email ?? "U")[0].toUpperCase()}
                      </span>
                    )}
                    <span className="hidden sm:block max-w-[120px] truncate text-sm font-medium text-foreground">
                      {user.displayName ?? user.email}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Dropdown panel */}
                  {dropdownOpen && (
                    <div
                      id="navbar-user-dropdown"
                      role="menu"
                      aria-orientation="vertical"
                      className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Signed in as</p>
                        <p className="text-sm font-semibold text-foreground truncate">
                          {user.displayName ?? "User"}
                        </p>
                        {user.email && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        )}
                      </div>

                      {/* Sign-out button */}
                      <div className="py-1">
                        <button
                          id="navbar-signout-btn"
                          role="menuitem"
                          type="button"
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Signed-out: Sign in with Google ── */
                <button
                  id="navbar-signin-btn"
                  type="button"
                  onClick={handleSignIn}
                  disabled={authLoading}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <LogIn className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  {authLoading ? "Signing in…" : "Sign in with Google"}
                </button>
              )}

              {/* Cart Icon — opens drawer */}
              <button
                id="navbar-cart-btn"
                type="button"
                onClick={openCart}
                aria-label={`Shopping Cart (${itemCount} items)`}
                className="relative rounded-full p-2 text-foreground transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-foreground transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none md:hidden"
                aria-controls="mobile-menu"
                aria-expanded={isOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="space-y-1 px-4 pt-2 pb-4 border-t border-gray-200/80 dark:border-gray-800/80 bg-background">
              <Link
                href="#"
                className="block rounded-md px-3 py-2 text-base font-medium text-foreground bg-gray-50 dark:bg-gray-900"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                href="#"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-foreground hover:bg-gray-50 dark:hover:bg-gray-900"
                onClick={() => setIsOpen(false)}
              >
                Products
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Cart drawer — rendered outside header so it can be full-screen */}
      <CartDrawer />
    </>
  );
}
