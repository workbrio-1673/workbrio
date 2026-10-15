import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import type { PortfolioItem } from "@/lib/supabase/types";

type PortfolioGridProps = {
  items: PortfolioItem[];
  /** When true, shows Edit/Delete controls per item. */
  editable?: boolean;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (item: PortfolioItem) => void;
};

/** Grid of portfolio work samples. */
export function PortfolioGrid({ items, editable = false, onEdit, onDelete }: PortfolioGridProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
        No portfolio items yet.
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden p-0">
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt={item.title}
              className="h-40 w-full object-cover"
            />
          ) : (
            <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-brand-500/15 via-grape-500/15 to-flare-500/15">
              <span className="text-4xl">🖼️</span>
            </div>
          )}
          <div className="p-5">
            <h4 className="font-bold text-ink-900">{item.title}</h4>
            {item.description && (
              <p className="mt-1.5 line-clamp-3 text-sm text-slate-600">
                {item.description}
              </p>
            )}
            <div className="mt-4 flex items-center gap-2">
              {item.link_url && (
                <Button
                  href={item.link_url}
                  target="_blank"
                  variant="secondary"
                  size="sm"
                >
                  View ↗
                </Button>
              )}
              {editable && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit?.(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => onDelete?.(item)}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
