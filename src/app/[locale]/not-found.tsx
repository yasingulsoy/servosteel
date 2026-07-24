import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-28 text-center lg:py-36">
      <p className="font-display text-7xl font-extrabold text-accent">404</p>
      <h1 className="font-display mt-6 text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-muted">{t("text")}</p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-accent px-6 py-3.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-accent-strong"
      >
        {t("back")}
      </Link>
    </section>
  );
}
