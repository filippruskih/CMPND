"use client";

import { useState } from "react";
import { Film, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DayDialog } from "@/components/calendar/day-dialog";
import type { CalendarDay } from "@/lib/calendar";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Inline style values, not Tailwind classes - this map feeds style.background
// directly, so every entry must be a valid CSS color.
const STATUS_DOT: Record<string, string> = {
  planned: "var(--muted-foreground)",
  drafted: "var(--chart-4)",
  posted: "var(--delta-good)",
  skipped: "var(--destructive)",
};

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function CalendarGrid({
  year,
  month, // 1-12
  days,
}: {
  year: number;
  month: number;
  days: Record<string, CalendarDay>;
}) {
  const [openDate, setOpenDate] = useState<string | null>(null);

  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = firstOfMonth.getUTCDay(); // 0 = Sunday
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const todayKey = toDateKey(new Date());

  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateKey(new Date(Date.UTC(year, month - 1, i + 1)))),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((dateKey, i) => {
          if (!dateKey) return <div key={i} className="aspect-square" />;
          const day = days[dateKey];
          const dayNum = Number(dateKey.slice(8, 10));
          const isToday = dateKey === todayKey;

          return (
            <button
              key={dateKey}
              onClick={() => setOpenDate(dateKey)}
              className={cn(
                "flex aspect-square flex-col items-center gap-1 rounded-lg border p-1 text-left transition-colors hover:bg-muted/60 sm:items-start sm:p-2",
                isToday && "border-primary"
              )}
            >
              <span className={cn("text-xs font-medium", isToday && "text-primary")}>{dayNum}</span>
              <div className="flex flex-wrap gap-0.5">
                {day?.published.map((p) => (
                  <span key={p.id} className="text-muted-foreground" title="Posted">
                    {p.contentType === "post" ? (
                      <ImageIcon className="size-3" />
                    ) : (
                      <Film className="size-3" />
                    )}
                  </span>
                ))}
                {day?.entries.map((e) => (
                  <span
                    key={e.id}
                    className="size-1.5 rounded-full"
                    style={{ background: STATUS_DOT[e.status] ?? STATUS_DOT.planned }}
                    title={`${e.title} (${e.status})`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <DayDialog
        dateKey={openDate ?? ""}
        day={openDate ? days[openDate] : undefined}
        open={openDate != null}
        onOpenChange={(v) => !v && setOpenDate(null)}
      />
    </>
  );
}
