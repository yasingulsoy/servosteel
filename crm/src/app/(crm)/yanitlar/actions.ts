"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sayi } from "@/lib/bicim";
import { yazarZorunlu } from "@/lib/oturum";
import { crmeAl } from "@/lib/panelden";

/** Gelen yanıtlar sayfasından: firmayı CRM'e alır, listeye geri döner. */
export async function crmeAlEylemi(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const id = sayi(fd.get("id"));
  if (!id) throw new Error("Firma yok.");
  await crmeAl(id, ben);
  revalidatePath("/yanitlar");
  revalidatePath("/");
  const g = String(fd.get("geri") ?? "");
  redirect(g.startsWith("/") && !g.startsWith("//") ? g : "/yanitlar");
}

/** Haritadan: firmayı CRM'e alır, CRM kaydının kimliğini döner (sayfa değişmez). */
export async function crmeAlHaritadan(hedefId: number): Promise<{ crmId: number }> {
  const ben = await yazarZorunlu();
  const id = sayi(hedefId);
  if (!id) throw new Error("Firma yok.");
  const crmId = await crmeAl(id, ben);
  revalidatePath("/yanitlar");
  return { crmId };
}
