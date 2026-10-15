import { timeAgo } from "@/lib/supabase/types";

/** One chat bubble: gradient on the right for my messages, white card on the left. */
export function MessageBubble({
  content,
  isMine,
  createdAt,
  seen,
}: {
  content: string;
  isMine: boolean;
  createdAt: string;
  seen: boolean;
}) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed ${
          isMine
            ? "rounded-br-lg bg-gradient-brand text-white shadow-md shadow-flare-500/20"
            : "rounded-bl-lg bg-white text-ink-900 card-ring"
        }`}
      >
        <p className="whitespace-pre-line break-words">{content}</p>
        <p
          className={`mt-1 text-right text-[11px] ${
            isMine ? "text-white/70" : "text-slate-400"
          }`}
        >
          {timeAgo(createdAt)}
          {isMine && seen ? " · Seen" : ""}
        </p>
      </div>
    </div>
  );
}
