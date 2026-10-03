import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { BackLink } from "@/components/back-link";
import { MoreToolsMenu } from "@/components/insights/more-tools-menu";
import { AddCompetitorDialog } from "@/components/competitors/add-competitor-dialog";
import { DiscoverAccountsDialog } from "@/components/competitors/discover-accounts-dialog";
import { ResyncCompetitorButton, DeleteCompetitorButton } from "@/components/competitors/competitor-actions";
import { getCompetitors } from "@/lib/competitors";
import { formatCompactNumber, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CompetitorsPage() {
  const competitors = await getCompetitors();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <BackLink href="/insights" label="Insights" />
      <PageHeader
        icon={Users}
        color="magenta"
        title="Competitors"
        description="Public account benchmarking via Instagram's Business Discovery API - followers, posts, likes, and comments. Reach and views aren't available for accounts you don't own."
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <MoreToolsMenu />
            <DiscoverAccountsDialog />
            <AddCompetitorDialog />
          </div>
        }
      />

      {competitors.length === 0 ? (
        <EmptyState
          icon={Users}
          color="magenta"
          title="No competitors tracked yet"
          description="Add a public Instagram Business or Creator account to start benchmarking against it."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {competitors.map((c) => (
            <Link key={c.id} href={`/competitors/${c.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex-1 truncate">
                    <p className="truncate text-sm font-medium">@{c.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.followersCount != null
                        ? `${formatCompactNumber(c.followersCount)} followers`
                        : "Not synced yet"}
                      {c.lastSyncedAt && ` · synced ${formatDate(c.lastSyncedAt)}`}
                      {c.lastSyncError && (
                        <span className="text-destructive"> · {c.lastSyncError}</span>
                      )}
                    </p>
                  </div>
                  <ResyncCompetitorButton id={c.id} />
                  <DeleteCompetitorButton id={c.id} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
