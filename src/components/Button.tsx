import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "pine" | "secondary" | "ghost" | "dark";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-brand text-white shadow-lg shadow-flare-500/25 hover:shadow-xl hover:shadow-flare-500/30 hover:brightness-110",
  /** Homepage green (mockup style) — pine green, no gradient. */
  pine: "bg-pine-600 text-white shadow-lg shadow-pine-600/25 hover:bg-pine-700 hover:shadow-xl",
  secondary:
    "bg-white text-ink-900 card-ring hover:border-brand-500 hover:text-brand-600",
  ghost: "text-ink-700 hover:bg-slate-100",
  dark: "bg-ink-900 text-white hover:bg-ink-800",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkButtonProps = CommonProps & {
  href: string;
  target?: string;
};

function classes(variant: Variant, size: Size, className = "") {
  return `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
}

/** Brand button — renders a <button>, or a Next.js <Link> when href is given. */
export function Button(props: ButtonProps | LinkButtonProps) {
  const { variant = "primary", size = "md", className = "", children } = props;

  if ("href" in props && props.href) {
    const { href, target } = props;
    return (
      <Link href={href} target={target} className={classes(variant, size, className)}>
        {children}
      </Link>
    );
  }

  const { ...rest } = props as ButtonProps;
  return (
    <button className={classes(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}
