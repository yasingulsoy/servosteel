import Link from "next/link";
import { Check, RotateCcw } from "lucide-react";
import { tarih, zaman } from "@/lib/bicim";
import type { Gorev } from "@/lib/veri";

type Eylem = (fd: FormData) => Promise<void>;

/**
 * Görev satırları. Tamamla düğmesi tek tık; otomatik görevler (kaynak dolu)
 * "otomatik" etiketi taşır.
 */
export function GorevListesi({
  gorevler,
  durumEylemi,
  geri,
  firmaGoster = true,
  yazabilir,
}: {
  gorevler: Gorev[];
  durumEylemi: Eylem;
  geri: string;
  firmaGoster?: boolean;
  yazabilir: boolean;
}) {
  if (!gorevler.length) return <p className="text-sm text-muted">Görev yok.</p>;
  return (
    <ul className="kart divide-y divide-line">
      {gorevler.map((g) => {
        const tamam = g.durum === "tamam";
        return (
          <li key={g.id} className="flex items-start gap-3 p-3">
            {yazabilir ? (
              <form action={durumEylemi}>
                <input type="hidden" name="gorev_id" value={g.id} />
                <input type="hidden" name="tamam" value={tamam ? "0" : "1"} />
                <input type="hidden" name="geri" value={geri} />
                <button
                  type="submit"
                  title={tamam ? "Yeniden aç" : "Tamamlandı"}
                  className={`mt-0.5 flex size-5 items-center justify-center rounded border ${
                    tamam ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-400 hover:border-emerald-600"
                  }`}
                >
                  {tamam ? <RotateCcw size={11} /> : <Check size={12} className="opacity-0 hover:opacity-60" />}
                </button>
              </form>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${tamam ? "text-muted line-through" : ""}`}>
                {g.baslik}
                {g.kaynak ? <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500">otomatik</span> : null}
              </p>
              <p className="text-xs text-muted">
                {firmaGoster && g.firma_ad ? (
                  <>
                    <Link href={`/firmalar/${g.firma_id}`} className="font-medium text-ink hover:underline">
                      {g.firma_ad}
                    </Link>
                    {" · "}
                  </>
                ) : null}
                {g.atanan ?? "sahipsiz"}
                {tamam && g.tamamlandi ? ` · ${g.tamamlayan ?? ""} ${zaman(g.tamamlandi)}` : ""}
              </p>
              {g.aciklama ? <p className="mt-0.5 text-sm text-muted">{g.aciklama}</p> : null}
            </div>
            {g.son_tarih && !tamam ? (
              <span className={`whitespace-nowrap text-xs font-semibold ${g.gecikti ? "text-red-700" : "text-muted"}`}>
                {g.gecikti ? "gecikti · " : ""}
                {tarih(g.son_tarih)}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
