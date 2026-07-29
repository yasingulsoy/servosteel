import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SocialIcons } from "@/components/social-icons";
import { CONTACT } from "@/lib/site";
import { getAkademiUi } from "@/lib/akademi-ui";

export function SiteFooter() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const ak = getAkademiUi(useLocale());

  const productLinks = [
    { label: tn("rollform"), href: "/roll-form-hatlari" },
    { label: t("slitting"), href: "/dilme-hatlari" },
    { label: tn("ctl"), href: "/boy-kesme-hatlari" },
    { label: tn("machines"), href: "/makineler" },
  ];

  const companyLinks = [
    { label: tn("about"), href: "/hakkimizda" },
    { label: ak.nav, href: "/akademi" },
    { label: t("refs"), href: "/referanslar" },
    { label: t("videos"), href: "/videolar" },
    { label: tn("contact"), href: "/iletisim" },
    { label: tn("quote"), href: "/teklif-al" },
  ];

  return (
    <footer className="bg-shell text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" aria-label={tn("homeAria")} className="inline-block">
              <Image
                src="/logo-full.png"
                alt="Servosteel"
                width={256}
                height={113}
                className="h-12 w-auto invert hue-rotate-180"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">{t("blurb")}</p>
            <SocialIcons
              className="mt-5 gap-1.5"
              linkClassName="size-9 rounded-lg bg-white/5 text-zinc-400 hover:bg-accent hover:text-zinc-950"
              iconClassName="size-[18px]"
            />
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              {t("products")}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              {t("corporate")}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              {t("contact")}
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-2.5 leading-relaxed">
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
                <span>
                  {CONTACT.addressStreet}
                  <br />
                  {CONTACT.addressLocality} / {CONTACT.addressRegion}
                </span>
              </li>
              <li>
                <a href={CONTACT.phoneHref} className="flex items-center gap-2.5 transition-colors hover:text-white">
                  <Phone className="size-4 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
                  {CONTACT.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2.5 transition-colors hover:text-white">
                  <Mail className="size-4 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
                  {CONTACT.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} Servosteel. {t("rights")}</p>
          <p>{t("tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
