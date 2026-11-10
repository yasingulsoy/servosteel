import type { Metadata } from "next";
import { haritaUlkeleri } from "@/lib/harita";
import { oturumZorunlu } from "@/lib/oturum";
import { HaritaSahnesi } from "./sahne";

export const metadata: Metadata = { title: "Harita" };

export default async function HaritaSayfasi() {
  await oturumZorunlu();
  const ulkeler = await haritaUlkeleri();
  return <HaritaSahnesi ulkeler={ulkeler} />;
}
