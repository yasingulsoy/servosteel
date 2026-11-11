"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Calculator, Layers } from "lucide-react";
import { feedCalc, sheetCalc, DENSITIES, type MaterialKey } from "@/lib/calc";
import { Card, NumField, Related, Result, Row, field, useFmt } from "@/components/calc-ui";
import { CoilCalculator } from "@/components/coil-calculator";

/**
 * Hesaplayıcılar sayfasının araçları.
 *
 * Başta tam genişlikte Servosteel rulo sac ağırlık ve uzunluk hesaplayıcısı
 * (coil-calculator.tsx) — dilme sonrası şerit ağırlıkları ve açıcı önerisi de
 * onun içinde. Eskiden ayrı bir "dilme verimi" kartı vardı; aynı hesap artık
 * ağırlıklarla birlikte rulo sac aracında yapıldığı için kaldırıldı.
 * Altında iki kart: sac/plaka ağırlığı ve pres besleme çıktısı.
 */
export function Calculators() {
  const t = useTranslations("calc");
  const fmt = useFmt();

  /* --- Sac / plaka ağırlığı — en çok aranan hesap ("sheet metal / steel plate
     weight calculator") --- */
  const [sheetMat, setSheetMat] = useState<MaterialKey>("steel");
  const [sheet, setSheet] = useState({ length: 2500, width: 1250, thickness: 3, qty: 1 });
  const sheetRes = sheetCalc({ ...sheet, density: DENSITIES[sheetMat] });

  /* --- Besleme çıktısı --- */
  /* Rulo sac uzunluğu isteğe bağlı ama 0 ile başlamıyor: boş/0 kutu ziyaretçiye
     anlamsız görünüyordu (2026-11-11). 1.000 m sık görülen bir rulo sac boyu. */
  const [feed, setFeed] = useState({ feed: 250, spm: 40, perStroke: 1, coilLength: 1000 });
  const feedRes = feedCalc(feed);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <CoilCalculator />

      {/* ---------- Sac / plaka ağırlığı ---------- */}
      <Card icon={Layers} title={t("sheetTitle")}>
        <div className="mt-5 space-y-4">
          <Row label={t("material")}>
            <select value={sheetMat} onChange={(e) => setSheetMat(e.target.value as MaterialKey)} className={field}>
              {(Object.keys(DENSITIES) as MaterialKey[]).map((k) => (
                <option key={k} value={k}>
                  {t(k)} — {fmt(DENSITIES[k], 2)} g/cm³
                </option>
              ))}
            </select>
          </Row>
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <NumField label={t("length")} unit="mm" value={sheet.length} onChange={(v) => setSheet({ ...sheet, length: v })} />
            <NumField label={t("width")} unit="mm" value={sheet.width} onChange={(v) => setSheet({ ...sheet, width: v })} />
            <NumField label={t("thickness")} unit="mm" value={sheet.thickness} onChange={(v) => setSheet({ ...sheet, thickness: v })} />
            <NumField label={t("qty")} integer value={sheet.qty} onChange={(v) => setSheet({ ...sheet, qty: v })} />
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-surface-alt p-4">
          {sheetRes ? (
            <>
              <Result label={t("pieceWeight")} value={fmt(sheetRes.weight, 2)} unit="kg" />
              {sheet.qty > 1 && <Result label={t("totalWeight")} value={fmt(sheetRes.total, 1)} unit="kg" />}
              <Result label={t("totalArea")} value={fmt(sheetRes.area, 3)} unit="m²" />
              <Result label={t("perM2")} value={fmt(sheetRes.perM2, 2)} unit="kg/m²" />
            </>
          ) : (
            <p className="text-sm text-muted">{t("invalid")}</p>
          )}
        </div>
        <Related href="/boy-kesme-hatlari" nameKey="boykesme.title" />
      </Card>

      {/* ---------- Pres besleme çıktısı ---------- */}
      <Card icon={Calculator} title={t("feedTitle")}>
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <NumField label={t("feedLen")} unit="mm" value={feed.feed} onChange={(v) => setFeed({ ...feed, feed: v })} />
            <NumField label={t("spm")} unit="1/min" integer value={feed.spm} onChange={(v) => setFeed({ ...feed, spm: v })} />
            <NumField label={t("perStroke")} integer value={feed.perStroke} onChange={(v) => setFeed({ ...feed, perStroke: v })} />
            <NumField label={t("coilLen")} unit="m" value={feed.coilLength} onChange={(v) => setFeed({ ...feed, coilLength: v })} />
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
        <Related href="/makineler/servo-suruculer" nameKey="products.machines.servo-suruculer.name" />
      </Card>
    </div>
  );
}
