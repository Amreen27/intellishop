import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | IntelliShop",
    default: "IntelliShop",
  },
  description: "Your one-stop destination for premium products at unbeatable prices.",
  openGraph: {
    title: "IntelliShop",
    description: "Your one-stop destination for premium products at unbeatable prices.",
    siteName: "IntelliShop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IntelliShop",
    description: "Your one-stop destination for premium products at unbeatable prices.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
