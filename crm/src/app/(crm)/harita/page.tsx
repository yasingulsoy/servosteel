import type { Metadata } from "next";
import { haritaAkisi, haritaFirmalari, haritaUlkeleri } from "@/lib/harita";
import { oturumZorunlu, yazabilir } from "@/lib/oturum";
import { HaritaSahnesi } from "./sahne";

export const metadata: Metadata = { title: "Harita" };

export default async function HaritaSayfasi() {
  const ben = await oturumZorunlu();
  const [ulkeler, veri, akis] = await Promise.all([haritaUlkeleri(), haritaFirmalari(), haritaAkisi()]);
  return <HaritaSahnesi ulkeler={ulkeler} veri={veri} akis={akis} yazabilir={yazabilir(ben)} />;
}
