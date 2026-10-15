"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "./LanguageProvider";

type Msg = { from: "bot" | "user"; text: string };

type Rule = { keys: string[]; en: string; ur: string };

/** Knowledge base: Workbrio guidance + freelancing business tips. */
const RULES: Rule[] = [
  {
    keys: ["salam", "hello", "hi", "aoa", "assalam", "hey"],
    en: "Hello! 👋 I'm Brio, your Workbrio guide. Ask me how to find work, post a job, grow your business — anything!",
    ur: "Assalam-o-Alaikum! 👋 Main Brio hoon, aap ka Workbrio guide. Poochhein — job kaise dhoondein, job kaise post karein, business kaise barhayein!",
  },
  {
    keys: ["job post", "post a job", "job lagana", "job dalna", "hire", "kaam dena"],
    en: "To post a job: 1) Sign in 2) Click 'Post a Job' 3) Write title, description, budget & skills 4) Publish — it's 100% FREE! 🎉",
    ur: "Job post karne ke liye: 1) Login karein 2) 'Post a Job' dabayein 3) Title, tafseel, budget aur skills likhein 4) Publish — bilkul MUFT! 🎉",
  },
  {
    keys: ["apply", "proposal", "cv", "apply karna", "darkhwast"],
    en: "To apply: open any job → write a cover note → set your bid → attach your CV (PDF) → Send proposal. Tip: mention 2-3 relevant past works! 💼",
    ur: "Apply karne ke liye: job kholein → cover note likhein → apni bid lagayein → CV (PDF) lagayein → Send proposal. Tip: 2-3 mutalliq kaam zaroor likhein! 💼",
  },
  {
    keys: ["price", "pricing", "rate", "paisa", "kimat", "kitna loon", "business", "karobar"],
    en: "💡 Business tip: Start with a competitive rate to win first clients & reviews. Then raise rates 10-20% every few projects. Quality + reviews = higher income!",
    ur: "💡 Business tip: Pehle clients aur reviews ke liye munasib rate rakhein. Phir har kuch projects ke baad 10-20% barhayein. Quality + reviews = zyada aamdani!",
  },
  {
    keys: ["client", "customer", "grahak"],
    en: "💡 To win clients: 1) Complete your profile with photo & portfolio 2) Write personalized proposals (not copy-paste!) 3) Reply fast 4) Deliver on time, every time.",
    ur: "💡 Clients jeetne ke liye: 1) Photo aur portfolio ke saath profile mukammal karein 2) Har proposal alag likhein 3) Jaldi jawab dein 4) Waqt par kaam dein.",
  },
  {
    keys: ["profile", "portfolio"],
    en: "A strong profile = more hires! Add: clear photo, catchy headline, all your skills, portfolio samples, and a fair hourly rate. 📸",
    ur: "Mazboot profile = zyada kaam! Shamil karein: saaf photo, achhi headline, tamam skills, kaam ke namoonay aur munasib rate. 📸",
  },
  {
    keys: ["free", "muft", "paisa", "fees", "commission", "kitne paise"],
    en: "Workbrio is 100% FREE — no commission, no hidden fees, forever! Unlike Fiverr (20%) or Upwork (10%), you keep EVERYTHING you earn. ❤️",
    ur: "Workbrio 100% MUFT hai — koi commission nahi, koi chhupi fees nahi, hamesha! Fiverr (20%) ya Upwork (10%) ke baraks, aap ki kamai poori aap ki! ❤️",
  },
  {
    keys: ["language", "zuban", "urdu", "bhasha"],
    en: "Workbrio speaks 10 languages! 🌍 Tap the 🌍 icon in the navbar to switch — including Urdu and Arabic with full right-to-left layout.",
    ur: "Workbrio 10 zabanein bolta hai! 🌍 Navbar mein 🌍 dabayein — Urdu aur Arabic samait, mukammal right-to-left ke saath.",
  },
  {
    keys: ["save", "bookmark", "mehfooz"],
    en: "Tap the 🔖 bookmark on any post or the Save button on any job to keep it in your Saved items. Find them from the left menu → Saved items.",
    ur: "Kisi post par 🔖 ya kisi job par Save dabayein — wo Saved items mein mehfooz ho jayegi. Left menu → Saved items mein dekhein.",
  },
  {
    keys: ["share"],
    en: "On any job page, use the Share buttons to send it via WhatsApp, Facebook or X — help friends find work! 📤",
    ur: "Kisi bhi job page par Share buttons se WhatsApp, Facebook ya X par bhejein — doston ko kaam dilayein! 📤",
  },
  {
    keys: ["grow", "barhao", "business tip", "success", "kamyab"],
    en: "💡 Grow your freelance business: 1) Niche down (1-2 skills) 2) Post daily on the feed 3) Collect 5-star reviews 4) Raise rates gradually 5) Stay active!",
    ur: "💡 Freelance business barhayein: 1) 1-2 skills par focus 2) Roz feed par post 3) 5-star reviews jama karein 4) Aahista rates barhayein 5) Active rahein!",
  },
  {
    keys: ["thank", "shukriya", "great", "acha"],
    en: "You're welcome! ❤️ Good luck with your freelancing journey — Work with Brio!",
    ur: "Khush aamdeed! ❤️ Aap ke freelancing safar ke liye naik khwahishat — Work with Brio!",
  },
];

const FALLBACK = {
  en: "Hmm, I'm still learning! 🤖 Try asking about: posting jobs, applying, CV, pricing, profile tips, or business growth.",
  ur: "Hmm, main abhi seekh raha hoon! 🤖 Poochhein: job post karna, apply karna, CV, pricing, profile tips, ya business growth.",
};

function findAnswer(input: string, lang: string): string {
  const lower = input.toLowerCase();
  const isUrdu = /[\u0600-\u06FF]/.test(input) || lang === "ur";
  for (const rule of RULES) {
    if (rule.keys.some((k) => lower.includes(k))) {
      return isUrdu ? rule.ur : rule.en;
    }
  }
  return isUrdu ? FALLBACK.ur : FALLBACK.en;
}

/** Floating AI guide widget — Brio, the Workbrio assistant. */
export function AIGuide() {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "bot",
      text:
        lang === "ur"
          ? "Assalam-o-Alaikum! 👋 Main Brio hoon. Job, business ya website ke baare mein kuch poochhein!"
          : "Hello! 👋 I'm Brio, your Workbrio guide. Ask me about jobs, business tips, or using the site!",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMsgs((m) => [...m, { from: "user", text }]);
    setInput("");
    setTimeout(() => {
      setMsgs((m) => [...m, { from: "bot", text: findAnswer(text, lang) }]);
    }, 400);
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI guide"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-2xl text-white shadow-xl transition hover:scale-105"
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[480px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:right-6">
          <div className="bg-gradient-brand px-4 py-3 text-white">
            <p className="font-extrabold">🤖 Brio — AI Guide</p>
            <p className="text-xs opacity-90">
              {lang === "ur" ? "Rehnumai ke liye hazir!" : "Here to guide you!"}
            </p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.from === "bot"
                    ? "bg-slate-100 text-ink-900"
                    : "ml-auto bg-brand-500 text-white"
                }`}
              >
                {m.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === "ur" ? "Kuch poochhein…" : "Ask something…"}
              className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <button
              type="submit"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white transition hover:bg-brand-600"
              aria-label="Send"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
