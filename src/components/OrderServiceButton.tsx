"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateConversation } from "@/lib/supabase/messaging";
import { Button } from "./Button";

/**
 * "Order now" button on a service page. Creates (or reuses) a conversation
 * with the freelancer, sends a first message about the service, then opens
 * /messages. Payments stay direct between buyer and freelancer (0% commission).
 */
export function OrderServiceButton({
  serviceTitle,
  servicePrice,
  freelancerId,
  buyerId,
}: {
  serviceTitle: string;
  servicePrice: number;
  freelancerId: string;
  buyerId: string;
}) {
  const router = useRouter();
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const order = async () => {
    setError(null);
    setOrdering(true);
    try {
      const supabase = createClient();
      const conversationId = await getOrCreateConversation(
        supabase,
        buyerId,
        freelancerId,
        null
      );
      const { error: msgErr } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: buyerId,
        content: `Hi! I'd like to order your service "${serviceTitle}" ($${Number(
          servicePrice
        ).toLocaleString("en-US")}). Please share the next steps.`,
      });
      if (msgErr) throw msgErr;
      router.push("/messages");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start the order. Please try again."
      );
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div>
      <Button onClick={order} disabled={ordering} className="w-full">
        {ordering ? "Starting order…" : "🛒 Order now"}
      </Button>
      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
