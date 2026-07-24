import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

/* Locale segmentine düşmeyen (nadir) istekler için sade yedek 404 */
export default function GlobalNotFound() {
  return (
    <html lang="tr" className={inter.className}>
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center text-zinc-900">
        <p className="text-6xl font-extrabold text-[#e7a300]">404</p>
        <h1 className="text-2xl font-bold">Sayfa bulunamadı / Page not found</h1>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- kök yedek 404, router dışında */}
        <a href="/" className="mt-2 rounded-lg bg-[#e7a300] px-5 py-3 text-sm font-bold text-zinc-950">
          Ana sayfa / Home
        </a>
      </body>
    </html>
  );
}
