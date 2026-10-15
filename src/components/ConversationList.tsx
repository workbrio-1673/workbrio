import { UnreadBadge } from "./UnreadBadge";
import { timeAgo, type ConversationWithPeer } from "@/lib/supabase/types";

function PeerAvatar({
  name,
  avatar,
}: {
  name: string | null;
  avatar: string | null;
}) {
  if (avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={avatar}
        alt={name ?? "Member"}
        className="h-12 w-12 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-lg font-extrabold text-white">
      {(name ?? "W")[0]?.toUpperCase()}
    </span>
  );
}

/** Left-hand conversation list for /messages. */
export function ConversationList({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: ConversationWithPeer[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-4xl">💬</p>
        <p className="mt-3 font-bold text-ink-900">No conversations yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Visit someone&apos;s profile and tap <strong>Message</strong> to
          start chatting.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {conversations.map((c) => {
        const active = c.id === activeId;
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                active ? "bg-brand-500/5" : ""
              }`}
            >
              <PeerAvatar name={c.peer_name} avatar={c.peer_avatar} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-bold text-ink-900">
                    {c.peer_name ?? "Workbrio member"}
                  </p>
                  {c.last_message_at && (
                    <span className="shrink-0 text-[11px] text-slate-400">
                      {timeAgo(c.last_message_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-slate-500">
                    {c.job_title ? (
                      <span className="mr-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-bold text-brand-600">
                        {c.job_title.length > 24
                          ? `${c.job_title.slice(0, 24)}…`
                          : c.job_title}
                      </span>
                    ) : null}
                    {c.last_message ?? "Say hello 👋"}
                  </p>
                  <UnreadBadge count={c.unread_count} className="shrink-0" />
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
