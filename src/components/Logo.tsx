import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  /** Where the logo links. Defaults to "/". Set to null for no link. */
  href?: string | null;
  /** Set when placed on a dark background — wraps the lockup in a white pill. */
  onDark?: boolean;
  /** Logo height in px (width scales automatically, lockup ratio 2560:896). */
  height?: number;
  className?: string;
};

/**
 * Workbrio brand lockup (approved v2): gradient "W" monogram with the
 * upward growth arrow, "Work" in black + "brio" in pink, and the
 * "FREELANCERS NETWORK" caption — exactly as designed.
 */
export function Logo({
  href = "/",
  onDark = false,
  height = 40,
  className = "",
}: LogoProps) {
  const img = (
    <Image
      src="/logo.png"
      alt="Workbrio — Freelancers Network"
      width={Math.round(height * (2560 / 896))}
      height={height}
      style={{ height, width: "auto" }}
      className={onDark ? "rounded-xl bg-white px-3 py-1.5" : ""}
      priority
    />
  );

  const inner = (
    <span className={`inline-flex items-center ${className}`}>{img}</span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} aria-label="Workbrio home" className="shrink-0">
      {inner}
    </Link>
  );
}
