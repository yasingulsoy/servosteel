"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cikisYap, girisYap } from "@/lib/oturum";

export async function girisEylemi(_onceki: string | null, fd: FormData): Promise<string | null> {
  const kullanici = String(fd.get("kullanici") ?? "").trim().toLowerCase();
  const parola = String(fd.get("parola") ?? "");
  if (!kullanici || !parola) return "Kullanıcı adı ve parola gerekli.";
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const hata = await girisYap(kullanici, parola, ip, h.get("user-agent"));
  if (hata) return hata;
  redirect("/");
}

export async function cikisEylemi(): Promise<void> {
  await cikisYap();
  redirect("/giris");
}
