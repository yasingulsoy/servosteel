import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Servosteel CRM", template: "%s · Servosteel CRM" },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function KokDuzen({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
