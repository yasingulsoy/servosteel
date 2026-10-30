import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { oturum } from "@/lib/oturum";
import { GirisFormu } from "./giris-formu";

export const metadata: Metadata = { title: "Giriş" };
export const dynamic = "force-dynamic";

export default async function GirisSayfasi() {
  if (await oturum()) redirect("/");
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-strong">Servosteel</p>
      <h1 className="mt-1 text-2xl font-bold">CRM</h1>
      <p className="mt-2 text-sm text-muted">Etkinlikler, firmalar, kurum yetkilileri ve takip.</p>
      <GirisFormu />
    </main>
  );
}
