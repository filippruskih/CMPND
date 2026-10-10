import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailMetric } from "@/components/detail-metric";
import { MetricLineChart } from "@/components/metric-line-chart";
import { BackLink } from "@/components/back-link";
import { getPostDetail, mediaTypeLabel } from "@/lib/posts";
import { formatDate, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostDetail(id);
  if (!post) notFound();

  const insight = post.latestInsight;
  const viewsHistory = post.insights
    .filter((s) => s.views != null)
    .map((s) => ({ date: s.capturedAt.toISOString(), value: s.views! }))
    .reverse();
  const topics: string[] = post.topicTags ? JSON.parse(post.topicTags) : [];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <BackLink href="/posts" label="Posts" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {post.thumbnailUrl && (
          <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-xl bg-muted shadow-[0_10px_24px_-12px_rgba(20,20,10,0.35)]">
            <Image src={post.thumbnailUrl} alt="" fill sizes="192px" className="object-cover" />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-sm text-muted-foreground">{formatDate(post.postedAt)}</p>
          <p className="max-w-2xl text-base">{post.caption ?? "No caption"}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{mediaTypeLabel(post.mediaType)}</Badge>
            {topics.map((topic) => (
              <Badge key={topic} variant="outline">
                {topic}
              </Badge>
            ))}
          </div>
          <Button variant="outline" size="sm" asChild className="w-fit">
            <Link href={post.permalink} target="_blank" rel="noreferrer">
              View on Instagram <ExternalLink />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DetailMetric label="Plays" value={insight?.views} index={0} />
        <DetailMetric label="Reach" value={insight?.reach} index={1} />
        <DetailMetric label="Likes" value={insight?.likes} index={2} />
        <DetailMetric label="Comments" value={insight?.comments} index={3} />
        <DetailMetric label="Shares" value={insight?.shares} index={4} />
        <DetailMetric label="Saves" value={insight?.saved} index={0} />
        <DetailMetric
          label="Engagement"
          value={insight?.engagementRate}
          index={1}
          format={(v) => formatPercent(v)}
        />
      </div>

      {viewsHistory.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plays over time</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricLineChart data={viewsHistory} dataKey="views" label="Plays" height={200} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
