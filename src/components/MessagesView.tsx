"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "./Card";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import type {
  ConversationWithPeer,
  MessageWithSender,
} from "@/lib/supabase/types";

type PeerRow = {
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
};

async function loadMessages(
  conversationId: string
): Promise<MessageWithSender[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_id, content, read_at, created_at, sender:sender_id(full_name, avatar_url)"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error || !data) return [];
  return (data as unknown as Record<string, unknown>[]).map((r) => {
    const s = (r.sender as PeerRow | null) ?? null;
    return {
      id: String(r.id),
      conversation_id: String(r.conversation_id),
      sender_id: String(r.sender_id),
      content: String(r.content),
      read_at: (r.read_at as string | null) ?? null,
      created_at: String(r.created_at),
      sender_name: s?.full_name ?? null,
      sender_avatar: s?.avatar_url ?? null,
    };
  });
}

/**
 * /messages client shell: conversation list + active chat.
 * Keeps previews/unread counts live via a realtime subscription.
 */
export function MessagesView({
  initialConversations,
  userId,
  initialConversationId,
}: {
  initialConversations: ConversationWithPeer[];
  userId: string;
  initialConversationId: string | null;
}) {
  const router = useRouter();
  const [conversations, setConversations] =
    useState<ConversationWithPeer[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(
    initialConversationId
  );
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const activeRef = useRef<string | null>(initialConversationId);
  activeRef.current = activeId;

  const active = conversations.find((c) => c.id === activeId) ?? null;

  // Load messages whenever the active conversation changes.
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);
    loadMessages(activeId)
      .then((rows) => {
        if (!cancelled) setMessages(rows);
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // Realtime: any new message in one of my conversations refreshes the
  // list preview. The active chat's own ChatWindow handles its messages.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("messages:all-mine")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };
          if (row.conversation_id === activeRef.current) return; // ChatWindow owns it
          setConversations((prev) =>
            prev.map((c) =>
              c.id === row.conversation_id
                ? {
                    ...c,
                    last_message: row.content,
                    last_message_at: row.created_at,
                    last_message_sender: row.sender_id,
                    unread_count:
                      row.sender_id === userId
                        ? c.unread_count
                        : c.unread_count + 1,
                    updated_at: row.created_at,
                  }
                : c
            )
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const select = (id: string) => {
    setActiveId(id);
    router.replace(`/messages?conversation=${id}`, { scroll: false });
  };

  // After I send: bump the conversation preview + clear its unread.
  const handleSent = (conversationId: string, content: string) => {
    setConversations((prev) =>
      prev
        .map((c) =>
          c.id === conversationId
            ? {
                ...c,
                last_message: content,
                last_message_at: new Date().toISOString(),
                last_message_sender: userId,
                unread_count: 0,
                updated_at: new Date().toISOString(),
              }
            : c
        )
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    );
  };

  return (
    <div className="grid gap-0 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm md:grid-cols-[320px_1fr]">
      {/* Conversation list */}
      <div className="max-h-[70vh] overflow-y-auto border-b border-slate-100 md:border-b-0 md:border-r">
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={select}
        />
      </div>

      {/* Chat pane */}
      <div className="flex h-[70vh] min-h-[420px] min-w-0 flex-col">
        {active ? (
          loadingMessages ? (
            <p className="m-auto text-sm text-slate-500">Loading messages…</p>
          ) : (
            <ChatWindow
              key={active.id}
              conversationId={active.id}
              peer={{
                id: active.peer_id,
                name: active.peer_name,
                avatar: active.peer_avatar,
                headline: active.peer_headline,
                jobTitle: active.job_title,
              }}
              userId={userId}
              initialMessages={messages}
              onSent={handleSent}
            />
          )
        ) : (
          <div className="m-auto px-6 text-center">
            <p className="text-4xl">💬</p>
            <p className="mt-3 font-bold text-ink-900">
              Select a conversation
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Pick someone from the list to start chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
