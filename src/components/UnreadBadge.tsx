/** Small unread-count pill. Renders nothing when count is 0. */
export function UnreadBadge({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      className={`inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-flare-500 px-1.5 text-[11px] font-extrabold text-white ${className}`}
    >
      {label}
    </span>
  );
}
