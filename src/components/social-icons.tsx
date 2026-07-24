import type { IconType } from "react-icons";
import { FaInstagram, FaLinkedinIn, FaWhatsapp, FaYoutube } from "react-icons/fa6";

const socials: { label: string; href: string; Icon: IconType }[] = [
  { label: "WhatsApp", href: "https://wa.me/902164153005", Icon: FaWhatsapp },
  { label: "Instagram", href: "https://www.instagram.com/servosteel_turkey/", Icon: FaInstagram },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/servosteel.tr/", Icon: FaLinkedinIn },
  { label: "YouTube", href: "https://www.youtube.com/@ServoSteel.ServoMold", Icon: FaYoutube },
];

/** Sosyal medya ikon listesi — header ve footer'da kullanılıyor */
export function SocialIcons({
  className = "",
  linkClassName = "",
  iconClassName = "size-[18px]",
}: {
  className?: string;
  linkClassName?: string;
  iconClassName?: string;
}) {
  return (
    <ul className={`flex items-center ${className}`}>
      {socials.map(({ label, href, Icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className={`flex items-center justify-center transition-colors ${linkClassName}`}
          >
            <Icon className={iconClassName} aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}
