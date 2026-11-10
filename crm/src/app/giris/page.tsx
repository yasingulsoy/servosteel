import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { oturum } from "@/lib/oturum";
import { GirisFormu } from "./giris-formu";

export const metadata: Metadata = { title: "Giriş" };
export const dynamic = "force-dynamic";

/* Yerleşim dekoartizan panelinin giriş sayfasından: solda form, sağda koyu
   marka alanı (geniş ekranda). */
export default async function GirisSayfasi() {
  if (await oturum()) redirect("/");
  return (
    <div className="relative z-1 bg-white p-6 sm:p-0">
      <div className="relative flex min-h-dvh w-full flex-col justify-center lg:flex-row">
        <div className="flex w-full flex-1 flex-col lg:w-1/2">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            <Image src="/logo-full.png" alt="Servosteel" width={256} height={113} priority className="mb-8 h-14 w-auto self-start lg:hidden" />
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md">Giriş yap</h1>
              <p className="text-sm text-gray-500">Kullanıcı adınız ve parolanızla CRM&apos;e girin.</p>
            </div>
            <GirisFormu />
            <p className="mt-5 text-sm text-gray-500">Sitenin yönetim paneli hesabınızla da girebilirsiniz.</p>
          </div>
        </div>

        <div className="relative hidden h-dvh w-full items-center overflow-hidden bg-brand-950 lg:grid lg:w-1/2">
          {/* Izgara deseni (GridShape) */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 75%)",
            }}
          />
          <div className="relative z-1 flex items-center justify-center">
            <div className="flex max-w-xs flex-col items-center">
              <Image src="/logo-full-light.png" alt="Servosteel" width={256} height={113} priority className="mb-6 h-20 w-auto" />
              <p className="text-center text-gray-400">CRM: etkinlikler, firmalar, kurum yetkilileri ve takip.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
