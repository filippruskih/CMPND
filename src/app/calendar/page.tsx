import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ContentTabs } from "@/components/content-tabs";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { getCalendarMonth } from "@/lib/calendar";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function clampMonth(year: number, month: number): { year: number; month: number } {
  if (month < 1) return { year: year - 1, month: 12 };
  if (month > 12) return { year: year + 1, month: 1 };
  return { year, month };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getUTCFullYear();
  const month = Number(params.month) || now.getUTCMonth() + 1;

  const daysMap = await getCalendarMonth(year, month);
  const days = Object.fromEntries(daysMap);

  const prev = clampMonth(year, month - 1);
  const next = clampMonth(year, month + 1);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        icon={CalendarDays}
        color="orange"
        title="Calendar"
        description="Plan upcoming reels and posts, alongside what you've actually posted."
      />

      <ContentTabs active="calendar" />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/calendar?year=${prev.year}&month=${prev.month}`}>
              <ChevronLeft />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/calendar?year=${now.getUTCFullYear()}&month=${now.getUTCMonth() + 1}`}>
              Today
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/calendar?year=${next.year}&month=${next.month}`}>
              <ChevronRight />
            </Link>
          </Button>
        </div>
      </div>

      <CalendarGrid year={year} month={month} days={days} />
    </div>
  );
}
