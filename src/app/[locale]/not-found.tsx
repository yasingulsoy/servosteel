import { useTranslations } from "next-intl";
import { SpecularButton } from "@/components/specular-button";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-28 text-center lg:py-36">
      <p className="font-display text-7xl font-extrabold text-accent">404</p>
      <h1 className="font-display mt-6 text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-muted">{t("text")}</p>
      <SpecularButton href="/" variant="gold" size="lg" className="mt-8">
        {t("back")}
      </SpecularButton>
    </section>
  );
}
