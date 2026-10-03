import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackLink } from "@/components/back-link";
import { MetricLineChart } from "@/components/metric-line-chart";
import { ResyncCompetitorButton, DeleteCompetitorButton } from "@/components/competitors/competitor-actions";
import { getCompetitorDetail } from "@/lib/competitors";
import { formatCompactNumber, formatDate, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CompetitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const competitor = await getCompetitorDetail(id);
  if (!competitor) notFound();

  const followerHistory = competitor.snapshots
    .filter((s) => s.followersCount != null)
    .map((s) => ({ date: s.capturedAt.toISOString(), value: s.followersCount! }));

  const sortedMedia = [...competitor.media].sort(
    (a, b) => (b.proxyEngagementRate ?? 0) - (a.proxyEngagementRate ?? 0)
  );

  return (
    <div className="flex flex-1 flex-col gap-4">
      <BackLink href="/competitors" label="Competitors" />

      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">@{competitor.username}</h1>
          <p className="text-sm text-muted-foreground">
            {competitor.followersCount != null
              ? `${formatCompactNumber(competitor.followersCount)} followers`
              : "Not synced yet"}
            {competitor.mediaCount != null && ` · ${formatCompactNumber(competitor.mediaCount)} posts total`}
          </p>
          {competitor.lastSyncError && (
            <p className="text-sm text-destructive">{competitor.lastSyncError}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <ResyncCompetitorButton id={competitor.id} />
          <DeleteCompetitorButton id={competitor.id} redirectTo="/competitors" />
        </div>
      </div>

      {followerHistory.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Follower growth</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricLineChart data={followerHistory} dataKey="followers" label="Followers" height={200} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent posts, by engagement</CardTitle>
          <p className="text-xs text-muted-foreground">
            Engagement here is (likes + comments) / followers - the only proxy available for a
            public account. Not directly comparable to your own reach-based engagement rate.
          </p>
        </CardHeader>
        <CardContent>
          {sortedMedia.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts synced yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedMedia.map((m) => (
                <Card key={m.id} className="overflow-hidden">
                  <CardContent className="flex flex-col gap-2">
                    {m.thumbnailUrl && (
                      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={m.thumbnailUrl}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <p className="line-clamp-2 min-h-10 text-sm">{m.caption ?? "No caption"}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(m.postedAt)}</span>
                      <Link href={m.permalink} target="_blank" rel="noreferrer" className="hover:text-foreground">
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2 text-xs">
                      <span>
                        {m.likeCount != null ? formatCompactNumber(m.likeCount) : "-"} likes ·{" "}
                        {m.commentsCount != null ? formatCompactNumber(m.commentsCount) : "-"} comments
                      </span>
                      <span className="font-medium">
                        {m.proxyEngagementRate != null ? formatPercent(m.proxyEngagementRate) : "-"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
