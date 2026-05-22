import type { Metadata } from "next";
// Local font fallback to prevent build-time network download failures on Google Fonts
const outfit = {
  variable: "font-sans",
};

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

import "./globals.css";
import PageTransition from "@/components/PageTransition";
import { CartProvider } from "./context/CartContext";
import AuthSync from "@/components/AuthSync";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-[#FDFBF7] font-sans overflow-x-hidden w-full">
        <CartProvider>
          <AuthSync />
          <PageTransition>
            {children}
          </PageTransition>
        </CartProvider>
      </body>
    </html>
  );
}
