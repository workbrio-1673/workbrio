import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  /** Adds a soft hover lift — nice for clickable listing cards. */
  hover?: boolean;
};

/** White surface card with the brand's soft ring and shadow. */
export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`card-ring rounded-2xl bg-white p-6 shadow-sm ${
        hover ? "transition-all duration-200 hover:-translate-y-1 hover:shadow-lg" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
