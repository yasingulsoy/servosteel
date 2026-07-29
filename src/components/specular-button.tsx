"use client";

import { useCallback } from "react";
import { Link } from "@/i18n/navigation";

export type SpecularVariant = "gold" | "dark" | "light" | "ghost";
export type SpecularSize = "md" | "lg";

const sizeCls: Record<SpecularSize, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-sm",
};

const variantCls: Record<SpecularVariant, string> = {
  gold: "bg-accent text-zinc-950 shadow-lg shadow-accent/25 hover:shadow-accent/40",
  dark: "bg-zinc-950 text-white shadow-lg shadow-black/25",
  light: "bg-white text-zinc-950 shadow-lg shadow-black/10",
  ghost: "border border-current/30 text-current hover:bg-current/10",
};

type Props = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: SpecularVariant;
  size?: SpecularSize;
  /** http linki yeni sekmede açılsın */
  external?: boolean;
  className?: string;
  ariaLabel?: string;
};

/**
 * Specular button — imleci takip eden ışık + otomatik parıltı süpürmesi + cam
 * parlaması. reactbits Specular Button esini, WebGL yerine hafif CSS ile;
 * her yerde güvenle kullanılır (WebGL context limiti yok).
 */
export function SpecularButton({
  children,
  href,
  onClick,
  type = "button",
  variant = "gold",
  size = "lg",
  external,
  className = "",
  ariaLabel,
}: Props) {
  const onMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);

  const cls = `group/spec relative isolate inline-flex select-none items-center justify-center overflow-hidden rounded-lg font-bold transition-transform duration-200 active:scale-[0.98] ${sizeCls[size]} ${variantCls[variant]} ${className}`;
  const sheenTint = variant === "gold" || variant === "light" ? "via-white/45" : "via-white/25";

  const inner = (
    <>
      {/* üst cam parlaması */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent opacity-60" />
      {/* otomatik parıltı süpürmesi */}
      <span
        aria-hidden
        className={`specular-sheen pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent to-transparent ${sheenTint}`}
      />
      {/* imleci takip eden specular ışık */}
      <span
        aria-hidden
        className="specular-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/spec:opacity-100"
      />
      {/* iç kenar ışığı */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/15" />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </>
  );

  if (href) {
    const isHttp = /^https?:/.test(href);
    const isExternalProtocol = isHttp || /^(mailto:|tel:)/.test(href);
    if (isExternalProtocol) {
      return (
        <a
          href={href}
          onMouseMove={onMove}
          onClick={onClick}
          className={cls}
          aria-label={ariaLabel}
          target={isHttp && external ? "_blank" : undefined}
          rel={isHttp && external ? "noopener noreferrer" : undefined}
        >
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} onMouseMove={onMove} onClick={onClick} className={cls} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} onMouseMove={onMove} onClick={onClick} className={cls} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}
