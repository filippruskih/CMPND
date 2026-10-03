"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCompactNumber, formatPercent } from "@/lib/format";
import type { ReelWithLatestInsight } from "@/lib/stats";

export function TopReelsDialog({ trigger, reels }: { trigger: ReactNode; reels: ReelWithLatestInsight[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button type="button" onClick={() => setOpen(true)} className="w-full text-left">
        {trigger}
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Top {reels.length} reels</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3 px-1.5 text-xs text-muted-foreground">
          <span className="w-5 shrink-0" />
          <span className="size-10 shrink-0" />
          <span className="flex-1">Reel</span>
          <span className="shrink-0">Plays</span>
          <span className="w-12 shrink-0 text-right">Engagement</span>
        </div>
        <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
          {reels.map((reel, i) => {
            const insight = reel.latestInsight;
            return (
              <Link
                key={reel.id}
                href={`/reels/${reel.id}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-1.5 py-2 hover:bg-muted/60"
              >
                <span className="w-5 shrink-0 text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                {reel.thumbnailUrl && (
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image src={reel.thumbnailUrl} alt="" fill sizes="40px" className="object-cover" />
                  </div>
                )}
                <span className="line-clamp-1 flex-1 text-sm">{reel.caption ?? "No caption"}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {insight?.views != null ? `${formatCompactNumber(insight.views)} plays` : "-"}
                </span>
                <span className="w-12 shrink-0 text-right text-xs font-medium">
                  {insight?.engagementRate != null ? formatPercent(insight.engagementRate) : "-"}
                </span>
              </Link>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
