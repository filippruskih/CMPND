import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCompactNumber, formatDate, formatPercent, formatSecondsFromMs } from "@/lib/format";
import type { ReelWithLatestInsight } from "@/lib/stats";

export function ReelsGrid({ reels }: { reels: ReelWithLatestInsight[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reels.map((reel) => {
        const insight = reel.latestInsight;
        return (
          <Card
            key={reel.id}
            className="flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardContent className="flex flex-1 flex-col gap-3">
              <Link href={`/reels/${reel.id}`} className="group flex flex-col gap-3">
                <div className="relative aspect-9/16 w-full overflow-hidden rounded-xl bg-muted">
                  {reel.thumbnailUrl ? (
                    <Image
                      src={reel.thumbnailUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="size-full bg-muted" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="line-clamp-2 min-h-10 text-sm">
                    {reel.caption ?? "No caption"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(reel.postedAt)}
                  </span>
                </div>
              </Link>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t pt-3 text-xs">
                <Stat label="Plays" value={insight?.views} />
                <Stat label="Likes" value={insight?.likes} />
                <Stat label="Comments" value={insight?.comments} />
                <Stat label="Saves" value={insight?.saved} />
                <Stat
                  label="Avg watch"
                  value={insight?.avgWatchTimeMs}
                  format={formatSecondsFromMs}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-semibold">
                  {insight?.engagementRate != null ? formatPercent(insight.engagementRate) : "-"}{" "}
                  <span className="font-normal text-muted-foreground">engagement</span>
                </span>
                <Link
                  href={reel.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Stat({
  label,
  value,
  format = formatCompactNumber,
}: {
  label: string;
  value: number | null | undefined;
  format?: (value: number) => string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value != null ? format(value) : "-"}</span>
    </div>
  );
}
