import { FileText, Mail, MailWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getRecentDailyReports } from "@/lib/daily-reports";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await getRecentDailyReports();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        icon={FileText}
        color="blue"
        title="Daily reports"
        description="A dated briefing generated every day, synthesizing that day's sync, analytics, trend, idea, and planning results."
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
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {formatDate(report.date)}
                    {i === 0 && (
                      <Badge variant="secondary" className="ml-2 font-normal">
                        Latest
                      </Badge>
                    )}
                  </CardTitle>
                  {report.emailSentAt ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Emailed">
                      <Mail className="size-3.5" /> Emailed
                    </span>
                  ) : report.emailError ? (
                    <span
                      className="flex items-center gap-1 text-xs text-destructive"
                      title={report.emailError}
                    >
                      <MailWarning className="size-3.5" /> Email failed
                    </span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {report.statsLines.length > 0 && (
                  <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                    {report.statsLines.map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                )}
                <p className="whitespace-pre-wrap text-sm">{report.summary}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
