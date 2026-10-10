import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBadge } from "@/components/icon-badge";
import { formatCompactNumber, formatPercent } from "@/lib/format";
import type { ReelWithLatestInsight } from "@/lib/stats";

export function TopReelCard({ reel }: { reel: ReelWithLatestInsight }) {
  const insight = reel.latestInsight;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <IconBadge icon={Trophy} color="yellow" size="sm" />
          Top reel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {reel.thumbnailUrl && (
            <div className="relative h-28 w-19 shrink-0 overflow-hidden rounded-xl bg-muted shadow-[0_6px_16px_-8px_rgba(20,20,10,0.3)]">
              <Image
                src={reel.thumbnailUrl}
                alt=""
                fill
                sizes="76px"
                className="object-cover"
              />
            </div>
          )}
          <div className="flex flex-1 flex-col gap-2 min-w-0">
            <p className="line-clamp-2 text-sm font-medium">{reel.caption ?? "No caption"}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {insight?.views != null && <span>{formatCompactNumber(insight.views)} plays</span>}
              {insight?.engagementRate != null && (
                <span>{formatPercent(insight.engagementRate)} engagement</span>
              )}
            </div>
            <Link
              href={reel.permalink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-1 text-xs underline text-muted-foreground hover:text-foreground"
            >
              View on Instagram <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
