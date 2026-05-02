import type { Metadata } from "next";
import { Outfit, Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["100", "300", "400", "700", "900"],
});

const notoLabels = Noto_Sans_TC({
  subsets: ["latin"],
  variable: "--font-noto",
  weight: ["100", "300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "CHURUN TEA | 初潤製茶所",
  description: "初潤製茶所精品會員中心 - 數位化營運與分潤系統",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${outfit.variable} ${notoLabels.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FDFBF7]">
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  );
}
