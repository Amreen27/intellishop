"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CartDrawer from "./CartDrawer";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { itemCount, openCart } = useCart();

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

            {/* Action Items (Cart & Hamburger) */}
            <div className="flex items-center gap-4">
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
