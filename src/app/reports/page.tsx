import { FileText, Mail, MailWarning, Play, Users, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/stat-tile";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MetricLineChart } from "@/components/metric-line-chart";
import { BackLink } from "@/components/back-link";
import { MoreToolsMenu } from "@/components/insights/more-tools-menu";
import { getRecentDailyReports, type DailyReportView } from "@/lib/daily-reports";
import { formatCompactNumber, formatDate, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

function ReportCard({ report, isLatest }: { report: DailyReportView; isLatest: boolean }) {
  const { stats } = report;

  return (
    <Card className="overflow-hidden">
      <div
        className="h-1.5 w-full"
        style={{ background: "linear-gradient(90deg, var(--primary), var(--chart-5))" }}
      />
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            {formatDate(report.date)}
            {isLatest && (
              <Badge variant="secondary" className="font-normal">
                Latest
              </Badge>
            )}
          </CardTitle>
          {report.emailSentAt ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Emailed">
              <Mail className="size-3.5" /> Emailed
            </span>
          ) : report.emailError ? (
            <span className="flex items-center gap-1 text-xs text-destructive" title={report.emailError}>
              <MailWarning className="size-3.5" /> Email failed
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Followers"
            icon={Users}
            color="blue"
            value={stats.followerCount != null ? formatCompactNumber(stats.followerCount) : "-"}
            delta={stats.followerDelta}
          />
          <StatTile
            label="Avg engagement"
            icon={Zap}
            color="yellow"
            value={stats.avgEngagementRate != null ? formatPercent(stats.avgEngagementRate) : "-"}
          />
          <StatTile
            label="Avg plays / reel"
            icon={Play}
            color="orange"
            value={stats.avgPlays != null ? formatCompactNumber(stats.avgPlays) : "-"}
          />
          <StatTile label="Posted this week" icon={FileText} color="aqua" value={String(stats.postsLast7Days)} />
        </div>

        {stats.followerHistory.length > 1 && (
          <MetricLineChart
            data={stats.followerHistory.map((h) => ({ date: h.date, value: h.followers }))}
            dataKey="followers"
            label="Followers"
            height={70}
          />
        )}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {stats.activeSuggestions > 0 && (
            <Badge variant="outline">{stats.activeSuggestions} active suggestion(s)</Badge>
          )}
          {stats.openBestPractices > 0 && (
            <Badge variant="outline">{stats.openBestPractices} open recommendation(s)</Badge>
          )}
          {stats.competitorCount > 0 && (
            <Badge variant="outline">Tracking {stats.competitorCount} competitor(s)</Badge>
          )}
        </div>

        <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm leading-relaxed">
          {report.summary}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function ReportsPage() {
  const reports = await getRecentDailyReports();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <BackLink href="/" label="Home" />
      <PageHeader
        icon={FileText}
        color="blue"
        title="Daily reports"
        description="A dated briefing generated every day, synthesizing that day's sync, analytics, trend, idea, and planning results."
        action={<MoreToolsMenu />}
      />

      {reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          color="blue"
          title="No reports yet"
          description="The daily report agent runs once a day (see Agents) - the first one will appear here after it runs."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map((report, i) => (
            <ReportCard key={report.id} report={report} isLatest={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
