import type { Metadata } from "next";
import { haritaAkisi, haritaNoktalari, haritaUlkeleri } from "@/lib/harita";
import { oturumZorunlu } from "@/lib/oturum";
import { HaritaSahnesi } from "./sahne";

export const metadata: Metadata = { title: "Harita" };

export default async function HaritaSayfasi() {
  await oturumZorunlu();
  const [ulkeler, noktalar, akis] = await Promise.all([haritaUlkeleri(), haritaNoktalari(), haritaAkisi()]);
  return <HaritaSahnesi ulkeler={ulkeler} noktalar={noktalar} akis={akis} />;
}
