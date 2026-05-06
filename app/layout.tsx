import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["100", "300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "CHURUN - PREMIUM V3.0.0",
  description: "初潤製茶所 - 精品級會員系統",
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: "cover",
};

import { CartProvider } from "./context/CartContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${outfit.variable} h-full antialiased overflow-x-hidden w-full`}
    >
      <body className="min-h-full flex flex-col bg-[#FDFBF7] font-sans overflow-x-hidden w-full">
        <CartProvider>
          <PageTransition>
            {children}
          </PageTransition>
        </CartProvider>
      </body>
    </html>
  );
}
