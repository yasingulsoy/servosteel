import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

/* Yönetim panelinin yazı tipi. latin-ext: ğ, ş, ı, İ aynı yazı tipinden gelsin. */
const outfit = Outfit({ subsets: ["latin", "latin-ext"], variable: "--font-outfit", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Servosteel CRM", template: "%s · Servosteel CRM" },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function KokDuzen({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={outfit.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
