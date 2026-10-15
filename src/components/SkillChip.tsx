type SkillChipProps = {
  name: string;
  /** When provided, renders a remove (×) button. */
  onRemove?: () => void;
};

/** Small rounded skill chip in the Workbrio style. */
export function SkillChip({ name, onRemove }: SkillChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-gradient-to-r from-brand-500/10 via-grape-500/10 to-flare-500/10 px-3.5 py-1.5 text-sm font-medium text-ink-900">
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove skill ${name}`}
          className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600"
        >
          ×
        </button>
      )}
    </span>
  );
}
