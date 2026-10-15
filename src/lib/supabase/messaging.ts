import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Canonical ordering for conversation participants: participant_1 is always
 * the "smaller" id (uuid text comparison), matching the DB check constraint
 * `participant_1 < participant_2`. Both client and server use this so a pair
 * of users always resolves to the same single conversation row.
 */
export function orderParticipants(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/**
 * Find the existing conversation between two users (optionally about a
 * specific job), or create it. Never creates duplicates: on a unique-
 * violation race it falls back to selecting the row that won.
 */
export async function getOrCreateConversation(
  supabase: SupabaseClient,
  meId: string,
  peerId: string,
  jobId: string | null = null
): Promise<string> {
  if (meId === peerId) {
    throw new Error("You cannot start a conversation with yourself.");
  }
  const [p1, p2] = orderParticipants(meId, peerId);

  const findExisting = async (): Promise<string | null> => {
    let query = supabase
      .from("conversations")
      .select("id")
      .eq("participant_1", p1)
      .eq("participant_2", p2);
    query = jobId ? query.eq("job_id", jobId) : query.is("job_id", null);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data ? (data as { id: string }).id : null;
  };

  const existing = await findExisting();
  if (existing) return existing;

  const { data: created, error: insErr } = await supabase
    .from("conversations")
    .insert({ participant_1: p1, participant_2: p2, job_id: jobId })
    .select("id")
    .single();

  if (insErr) {
    // Lost a race with another tab/request: the row exists now.
    const retry = await findExisting();
    if (retry) return retry;
    throw insErr;
  }
  return (created as { id: string }).id;
}
