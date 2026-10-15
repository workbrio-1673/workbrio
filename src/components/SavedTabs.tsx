"use client";

import { useState } from "react";
import { SavedList } from "./SavedList";
import { SavedJobsList } from "./SavedJobsList";

/** Tabs for saved posts vs saved jobs. */
export function SavedTabs({ userId }: { userId: string }) {
  const [tab, setTab] = useState<"posts" | "jobs">("posts");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-ink-900">🔖 Saved items</h1>
      <div className="flex rounded-full border border-slate-200 bg-white p-1">
        {(["posts", "jobs"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setTab(m)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-bold capitalize transition ${
              tab === m
                ? "bg-ink-900 text-white shadow"
                : "text-slate-500 hover:text-ink-900"
            }`}
          >
            {m === "posts" ? "📰 Posts" : "💼 Jobs"}
          </button>
        ))}
      </div>
      {tab === "posts" ? (
        <SavedList userId={userId} />
      ) : (
        <SavedJobsList userId={userId} />
      )}
    </div>
  );
}
