import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { IconBadge } from "@/components/icon-badge";
import type { DailyReportView } from "@/lib/daily-reports";
import { formatDate } from "@/lib/format";

export function DailyReportCallout({ report }: { report: DailyReportView | null }) {
  if (!report) return null;

  const isToday = new Date(report.date).toDateString() === new Date().toDateString();

  return (
    <Link href="/reports">
      <Card className="transition-all hover:-translate-y-0.5 hover:bg-muted/30">
        <CardContent className="flex items-center gap-3 py-3">
          <IconBadge icon={FileText} color="blue" size="sm" />
          <div className="flex-1 truncate">
            <p className="text-sm font-medium">
              {isToday ? "Today's report is ready" : `Report from ${formatDate(report.date)}`}
            </p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{report.summary}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
