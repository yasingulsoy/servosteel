import type { IconType } from "react-icons";
import { FaInstagram, FaLinkedinIn, FaYoutube } from "react-icons/fa6";

const socials: { label: string; href: string; Icon: IconType; color: string }[] = [
  { label: "Instagram", href: "https://www.instagram.com/servosteel_turkey/", Icon: FaInstagram, color: "#E4405F" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/servosteel.tr/", Icon: FaLinkedinIn, color: "#0A66C2" },
  { label: "YouTube", href: "https://www.youtube.com/@ServoSteel.ServoMold", Icon: FaYoutube, color: "#FF0000" },
];

/**
 * Sosyal medya ikon listesi.
 * variant="brand": her ikon kendi marka renginde (header'da).
 * variant="mono": currentColor — linkClassName ile renklenir (footer'da).
 */
export function SocialIcons({
  className = "",
  linkClassName = "",
  iconClassName = "size-[18px]",
  variant = "mono",
}: {
  className?: string;
  linkClassName?: string;
  iconClassName?: string;
  variant?: "mono" | "brand";
}) {
  return (
    <ul className={`flex items-center ${className}`}>
      {socials.map(({ label, href, Icon, color }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            style={variant === "brand" ? { color } : undefined}
            className={`flex items-center justify-center transition-all ${
              variant === "brand" ? "hover:scale-110" : ""
            } ${linkClassName}`}
          >
            <Icon className={iconClassName} aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}
