"use client";

import { Button } from "./Button";
import { useLanguage } from "./LanguageProvider";

/** Translated header for /jobs: title + open count + post button. */
export function JobsHeader({
  count,
  isClient,
}: {
  count: number;
  isClient: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          {t("jobs.title")}
        </h1>
        <p className="mt-1 text-slate-600">
          {t("jobs.openCount", { n: count })}
        </p>
      </div>
      {isClient && (
        <Button href="/jobs/new" size="sm">
          {t("jobs.postAJob")}
        </Button>
      )}
    </div>
  );
}
