import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/AppNavbar";
import { Footer } from "@/components/Footer";
import { MessagesView } from "@/components/MessagesView";
import { getOrCreateConversation } from "@/lib/supabase/messaging";
import type { ConversationWithPeer } from "@/lib/supabase/types";

/** Messages inbox: /messages — 1:1 realtime chat.
 *  Session is read via cookies(), so this renders dynamically. */
export const instant = false;

type SearchParams = {
  conversation?: string;
  peer?: string;
  job?: string;
};

type ConvRow = {
  id: string;
  participant_1: string;
  participant_2: string;
  job_id: string | null;
  created_at: string;
  updated_at: string;
  peer1: { full_name: string | null; avatar_url: string | null; headline: string | null } | null;
  peer2: { full_name: string | null; avatar_url: string | null; headline: string | null } | null;
  job: { title: string | null } | null;
};

async function loadConversations(userId: string): Promise<ConversationWithPeer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, participant_1, participant_2, job_id, created_at, updated_at," +
        " peer1:participant_1(full_name, avatar_url, headline)," +
        " peer2:participant_2(full_name, avatar_url, headline)," +
        " job:job_id(title)"
    )
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error || !data) return []; // migration not run yet -> empty, not a crash
  const rows = data as unknown as ConvRow[];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const [lastRes, unreadRes] = await Promise.all([
    supabase
      .from("messages")
      .select("conversation_id, content, created_at, sender_id")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false }),
    supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", ids)
      .neq("sender_id", userId)
      .is("read_at", null),
  ]);

  const lastByConv = new Map<string, { content: string; created_at: string; sender_id: string }>();
  for (const m of ((lastRes.data ?? []) as {
    conversation_id: string;
    content: string;
    created_at: string;
    sender_id: string;
  }[])) {
    if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m);
  }
  const unreadByConv = new Map<string, number>();
  for (const m of ((unreadRes.data ?? []) as { conversation_id: string }[])) {
    unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) ?? 0) + 1);
  }

  return rows.map((r) => {
    const iAmP1 = r.participant_1 === userId;
    const peer = iAmP1 ? r.peer2 : r.peer1;
    const last = lastByConv.get(r.id);
    return {
      id: r.id,
      participant_1: r.participant_1,
      participant_2: r.participant_2,
      job_id: r.job_id,
      created_at: r.created_at,
      updated_at: r.updated_at,
      peer_id: iAmP1 ? r.participant_2 : r.participant_1,
      peer_name: peer?.full_name ?? null,
      peer_avatar: peer?.avatar_url ?? null,
      peer_headline: peer?.headline ?? null,
      job_title: r.job?.title ?? null,
      last_message: last?.content ?? null,
      last_message_at: last?.created_at ?? null,
      last_message_sender: last?.sender_id ?? null,
      unread_count: unreadByConv.get(r.id) ?? 0,
    };
  });
}

/** Protected messages page: /messages */
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <AppNavbar />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="text-slate-600">
            Supabase is not connected yet. See README.md for setup.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;

  // "Message" buttons link here with ?peer=<id>(&job=<id>): resolve to a
  // conversation, then redirect to the canonical ?conversation= URL.
  if (params.peer && params.peer !== user.id) {
    const jobId = params.job && params.job.length > 0 ? params.job : null;
    try {
      const conversationId = await getOrCreateConversation(
        supabase,
        user.id,
        params.peer,
        jobId
      );
      redirect(`/messages?conversation=${conversationId}`);
    } catch {
      // Fall through to the inbox (e.g. migration not run yet).
    }
  }

  const conversations = await loadConversations(user.id);

  let activeId: string | null = null;
  if (params.conversation) {
    activeId = conversations.some((c) => c.id === params.conversation)
      ? (params.conversation as string)
      : null;
  }
  if (!activeId && conversations.length > 0) {
    activeId = conversations[0].id;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          Messages
        </h1>
        <p className="mt-1 text-slate-600">
          Realtime 1:1 chat with freelancers and clients.
        </p>
        <div className="mt-6">
          <MessagesView
            initialConversations={conversations}
            userId={user.id}
            initialConversationId={activeId}
          />
        </div>
        {/* Preload is handled client-side on selection to keep
            the first paint fast. */}
      </main>
      <Footer />
    </div>
  );
}
