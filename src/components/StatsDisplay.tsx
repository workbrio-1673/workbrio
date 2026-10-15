"use client";

import { useLanguage } from "./LanguageProvider";
import { Card } from "./Card";

/** "Kitne log aaye?" — translated labels, numbers from the server. */
export function StatsDisplay({
  total,
  today,
  unique7d,
}: {
  total: number;
  today: number;
  unique7d: number;
}) {
  const { t } = useLanguage();
  const stats = [
    { label: t("stats.totalVisits"), value: total.toLocaleString() },
    { label: t("stats.todayVisits"), value: today.toLocaleString() },
    { label: t("stats.unique7d"), value: unique7d.toLocaleString() },
  ];

  return (
    <Card className="bg-gradient-to-br from-brand-600 to-purple-600 text-white">
      <h2 className="text-lg font-extrabold">📊 {t("stats.title")}</h2>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-2xl font-extrabold sm:text-3xl">{s.value}</p>
            <p className="mt-1 text-xs text-white/80">{s.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
