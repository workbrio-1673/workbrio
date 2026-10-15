"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MessageBubble } from "./MessageBubble";
import { Button } from "./Button";
import type { MessageWithSender } from "@/lib/supabase/types";

type Peer = {
  id: string;
  name: string | null;
  avatar: string | null;
  headline: string | null;
  jobTitle: string | null;
};

/**
 * Right-hand chat pane: message history, realtime incoming messages,
 * send box, and read receipts.
 */
export function ChatWindow({
  conversationId,
  peer,
  userId,
  initialMessages,
  onSent,
}: {
  conversationId: string;
  peer: Peer;
  userId: string;
  initialMessages: MessageWithSender[];
  onSent: (conversationId: string, content: string) => void;
}) {
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const convRef = useRef(conversationId);
  convRef.current = conversationId;

  // Reset when switching conversations.
  useEffect(() => {
    setMessages(initialMessages);
    setDraft("");
    setError(null);
  }, [conversationId, initialMessages]);

  // Keep scrolled to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, conversationId]);

  // Mark the peer's messages as read whenever the list changes.
  const markRead = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", convRef.current)
        .neq("sender_id", userId)
        .is("read_at", null);
    } catch {
      /* read receipts are best-effort */
    }
  }, [userId]);

  useEffect(() => {
    markRead();
  }, [markRead, messages.length, conversationId]);

  // Realtime: append incoming messages for this conversation.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
            read_at: string | null;
            created_at: string;
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            const senderIsMe = row.sender_id === userId;
            return [
              ...prev,
              {
                ...row,
                sender_name: senderIsMe ? "You" : peer.name,
                sender_avatar: senderIsMe ? null : peer.avatar,
              },
            ];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, peer.name, peer.avatar]);

  const send = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: insErr } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: content.slice(0, 2000),
        })
        .select("id, conversation_id, sender_id, content, read_at, created_at")
        .single();
      if (insErr) throw insErr;
      const row = data as MessageWithSender;
      setMessages((prev) =>
        prev.some((m) => m.id === row.id)
          ? prev
          : [...prev, { ...row, sender_name: "You", sender_avatar: null }]
      );
      setDraft("");
      onSent(conversationId, content);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send the message."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Peer header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        {peer.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={peer.avatar}
            alt={peer.name ?? "Member"}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-sm font-extrabold text-white">
            {(peer.name ?? "W")[0]?.toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${peer.id}`}
            className="truncate font-bold text-ink-900 hover:text-brand-600"
          >
            {peer.name ?? "Workbrio member"}
          </Link>
          {peer.jobTitle && (
            <p className="truncate text-xs text-slate-500">
              About: {peer.jobTitle}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No messages yet. Say hello! 👋
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              content={m.content}
              isMine={m.sender_id === userId}
              createdAt={m.created_at}
              seen={m.read_at != null}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-slate-100 p-3">
        {error && (
          <p className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={`Message ${peer.name ?? "them"}…`}
            className="max-h-32 flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500"
          />
          <Button size="sm" onClick={send} disabled={sending || !draft.trim()}>
            {sending ? "…" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
