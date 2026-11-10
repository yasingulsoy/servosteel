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
  cerceve = true,
}: {
  gorevler: Gorev[];
  durumEylemi: Eylem;
  geri: string;
  firmaGoster?: boolean;
  yazabilir: boolean;
  /** false: başlıklı bir kartın (Panel) içinde, kendi çerçevesi olmadan. */
  cerceve?: boolean;
}) {
  if (!gorevler.length)
    return <p className={`px-5 py-4 text-sm text-gray-500 sm:px-6 ${cerceve ? "kart" : ""}`}>Görev yok.</p>;
  return (
    <ul className={`divide-y divide-gray-100 ${cerceve ? "kart" : ""}`}>
      {gorevler.map((g) => {
        const tamam = g.durum === "tamam";
        return (
          <li key={g.id} className="flex items-start gap-3 px-5 py-4 sm:px-6">
            {yazabilir ? (
              <form action={durumEylemi}>
                <input type="hidden" name="gorev_id" value={g.id} />
                <input type="hidden" name="tamam" value={tamam ? "0" : "1"} />
                <input type="hidden" name="geri" value={geri} />
                <button
                  type="submit"
                  title={tamam ? "Yeniden aç" : "Tamamlandı"}
                  className={`mt-0.5 flex size-5 items-center justify-center rounded-md border ${
                    tamam ? "border-brand-500 bg-brand-500 text-white" : "border-gray-300 bg-white hover:border-brand-500"
                  }`}
                >
                  {tamam ? <RotateCcw size={11} /> : <Check size={12} className="opacity-0 hover:opacity-60" />}
                </button>
              </form>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className={`text-theme-sm font-medium ${tamam ? "text-gray-400 line-through" : "text-gray-800"}`}>
                {g.baslik}
                {g.kaynak ? <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">otomatik</span> : null}
              </p>
              <p className="mt-0.5 text-theme-xs text-gray-500">
                {firmaGoster && g.firma_ad ? (
                  <>
                    <Link href={`/firmalar/${g.firma_id}`} className="font-medium text-gray-700 hover:text-brand-500">
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
              <span
                className={`rounded-full px-2.5 py-0.5 text-theme-xs font-medium whitespace-nowrap ${
                  g.gecikti ? "bg-error-50 text-error-600" : "bg-gray-100 text-gray-600"
                }`}
              >
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
