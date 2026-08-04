import { Zap, Building2, Warehouse, Car } from "lucide-react";
import type { Sector } from "@/lib/sectors";

const MAP = {
  energy: Zap,
  construction: Building2,
  logistics: Warehouse,
  automotive: Car,
} as const;

/** Sektör kartlarının ikonu — anahtar lib/sectors.ts'ten gelir. */
export function SectorIcon({
  name,
  className = "size-8",
}: {
  name: Sector["icon"];
  className?: string;
}) {
  const Icon = MAP[name] ?? Zap;
  return <Icon className={className} strokeWidth={1.8} aria-hidden />;
}
