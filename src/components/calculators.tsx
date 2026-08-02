"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calculator, Package, Scissors } from "lucide-react";
import { coilCalc, feedCalc, yieldCalc, DENSITIES, type MaterialKey } from "@/lib/calc";

const field =
  "w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25";

function Row({
  label,
  suffix,
  children,
}: {
  label: string;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between gap-2 text-xs font-medium text-muted">
        {label}
        {suffix && <span className="tabular-nums text-muted/70">{suffix}</span>}
      </span>
      {children}
    </label>
  );
}

function Result({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/60 py-2 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="font-display text-lg font-bold tabular-nums text-ink">
        {value} <span className="text-xs font-medium text-muted">{unit}</span>
      </span>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Calculator;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-spotlight
      className="rounded-2xl border border-line bg-card p-6 transition-colors hover:border-accent/40"
    >
      <h2 className="font-display flex items-center gap-2.5 text-lg font-bold uppercase tracking-tight text-ink">
        <Icon className="size-5 text-accent" strokeWidth={1.8} aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Sayıyı yerel biçimde, anlamlı basamakla yazar */
function useFmt() {
  const locale = useLocale();
  return (n: number, digits = 1) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n);
}

export function Calculators() {
  const t = useTranslations("calc");
  const fmt = useFmt();

  /* --- Rulo ağırlığı --- */
  const [material, setMaterial] = useState<MaterialKey>("steel");
  const [coil, setCoil] = useState({ od: 1400, id: 508, width: 1000, thickness: 2 });
  const coilRes = coilCalc({ ...coil, density: DENSITIES[material] });

  /* --- Besleme çıktısı --- */
  const [feed, setFeed] = useState({ feed: 250, spm: 40, perStroke: 1, coilLength: 0 });
  const feedRes = feedCalc(feed);

  /* --- Dilme verimi --- */
  const [sl, setSl] = useState({ coilWidth: 1250, stripWidth: 120, trim: 10 });
  const slRes = yieldCalc(sl);

  const num =
    (set: (v: number) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      set(e.target.value === "" ? 0 : Number(e.target.value));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* ---------- Rulo ağırlığı ve uzunluğu ---------- */}
      <Card icon={Package} title={t("coilTitle")}>
        <div className="mt-5 space-y-3">
          <Row label={t("material")}>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value as MaterialKey)}
              className={field}
            >
              {(Object.keys(DENSITIES) as MaterialKey[]).map((k) => (
                <option key={k} value={k}>
                  {t(k)} — {DENSITIES[k]} g/cm³
                </option>
              ))}
            </select>
          </Row>
          <div className="grid grid-cols-2 gap-3">
            <Row label={t("od")} suffix="mm">
              <input type="number" min={0} value={coil.od} onChange={num((v) => setCoil({ ...coil, od: v }))} className={field} />
            </Row>
            <Row label={t("id")} suffix="mm">
              <input type="number" min={0} value={coil.id} onChange={num((v) => setCoil({ ...coil, id: v }))} className={field} />
            </Row>
            <Row label={t("cwidth")} suffix="mm">
              <input type="number" min={0} value={coil.width} onChange={num((v) => setCoil({ ...coil, width: v }))} className={field} />
            </Row>
            <Row label={t("thickness")} suffix="mm">
              <input type="number" min={0} step="0.1" value={coil.thickness} onChange={num((v) => setCoil({ ...coil, thickness: v }))} className={field} />
            </Row>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-surface-alt p-4">
          {coilRes ? (
            <>
              <Result label={t("weight")} value={fmt(coilRes.weight, 0)} unit="kg" />
              <Result label={t("clength")} value={fmt(coilRes.length, 0)} unit="m" />
              <Result label={t("turns")} value={fmt(coilRes.turns, 0)} unit="" />
            </>
          ) : (
            <p className="text-sm text-muted">{t("invalid")}</p>
          )}
        </div>
      </Card>

      {/* ---------- Pres besleme çıktısı ---------- */}
      <Card icon={Calculator} title={t("feedTitle")}>
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Row label={t("feedLen")} suffix="mm">
              <input type="number" min={0} value={feed.feed} onChange={num((v) => setFeed({ ...feed, feed: v }))} className={field} />
            </Row>
            <Row label={t("spm")} suffix="1/min">
              <input type="number" min={0} value={feed.spm} onChange={num((v) => setFeed({ ...feed, spm: v }))} className={field} />
            </Row>
            <Row label={t("perStroke")}>
              <input type="number" min={1} value={feed.perStroke} onChange={num((v) => setFeed({ ...feed, perStroke: v }))} className={field} />
            </Row>
            <Row label={t("coilLen")} suffix="m">
              <input type="number" min={0} value={feed.coilLength} onChange={num((v) => setFeed({ ...feed, coilLength: v }))} className={field} />
            </Row>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-surface-alt p-4">
          {feedRes ? (
            <>
              <Result label={t("parts")} value={fmt(feedRes.partsPerHour, 0)} unit={t("pcsH")} />
              <Result label={t("speed")} value={fmt(feedRes.lineSpeed, 1)} unit="m/min" />
              <Result label={t("metersH")} value={fmt(feedRes.metersPerHour, 0)} unit="m/h" />
              {feedRes.coilHours !== null && (
                <Result label={t("coilHours")} value={fmt(feedRes.coilHours, 1)} unit={t("hour")} />
              )}
            </>
          ) : (
            <p className="text-sm text-muted">{t("invalid")}</p>
          )}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">{t("feedNote")}</p>
      </Card>

      {/* ---------- Dilme verimi ---------- */}
      <Card icon={Scissors} title={t("yieldTitle")}>
        <div className="mt-5 space-y-3">
          <Row label={t("coilWidth")} suffix="mm">
            <input type="number" min={0} value={sl.coilWidth} onChange={num((v) => setSl({ ...sl, coilWidth: v }))} className={field} />
          </Row>
          <div className="grid grid-cols-2 gap-3">
            <Row label={t("stripWidth")} suffix="mm">
              <input type="number" min={0} value={sl.stripWidth} onChange={num((v) => setSl({ ...sl, stripWidth: v }))} className={field} />
            </Row>
            <Row label={t("trim")} suffix="mm">
              <input type="number" min={0} value={sl.trim} onChange={num((v) => setSl({ ...sl, trim: v }))} className={field} />
            </Row>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-surface-alt p-4">
          {slRes ? (
            <>
              <Result label={t("strips")} value={fmt(slRes.strips, 0)} unit="" />
              <Result label={t("wastePct")} value={fmt(slRes.wastePct, 2)} unit="%" />
              <Result label={t("waste")} value={fmt(slRes.waste, 0)} unit="mm" />
            </>
          ) : (
            <p className="text-sm text-muted">{t("invalid")}</p>
          )}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">{t("yieldNote")}</p>
      </Card>
    </div>
  );
}
