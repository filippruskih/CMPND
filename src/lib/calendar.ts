import { db } from "@/lib/db";

export interface PublishedItem {
  id: string;
  contentType: "reel" | "post";
  caption: string | null;
  thumbnailUrl: string | null;
  permalink: string;
}

export interface CalendarDay {
  dateKey: string; // "YYYY-MM-DD"
  entries: { id: string; contentType: string; title: string; notes: string | null; status: string }[];
  published: PublishedItem[];
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// year is the full year, month is 1-12 (calendar convention, not JS's
// 0-indexed Date months) - converted at the one point it matters.
export async function getCalendarMonth(year: number, month: number): Promise<Map<string, CalendarDay>> {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1)); // exclusive - first of the next month

  const [entries, reels, posts] = await Promise.all([
    db.calendarEntry.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    }),
    db.reel.findMany({
      where: { postedAt: { gte: start, lt: end } },
      select: { id: true, caption: true, thumbnailUrl: true, permalink: true, postedAt: true },
    }),
    db.post.findMany({
      where: { postedAt: { gte: start, lt: end } },
      select: { id: true, caption: true, thumbnailUrl: true, permalink: true, postedAt: true },
    }),
  ]);

  const days = new Map<string, CalendarDay>();
  function ensure(key: string): CalendarDay {
    if (!days.has(key)) days.set(key, { dateKey: key, entries: [], published: [] });
    return days.get(key)!;
  }

  for (const e of entries) {
    ensure(dateKey(e.date)).entries.push({
      id: e.id,
      contentType: e.contentType,
      title: e.title,
      notes: e.notes,
      status: e.status,
    });
  }
  for (const r of reels) {
    ensure(dateKey(r.postedAt)).published.push({
      id: r.id,
      contentType: "reel",
      caption: r.caption,
      thumbnailUrl: r.thumbnailUrl,
      permalink: r.permalink,
    });
  }
  for (const p of posts) {
    ensure(dateKey(p.postedAt)).published.push({
      id: p.id,
      contentType: "post",
      caption: p.caption,
      thumbnailUrl: p.thumbnailUrl,
      permalink: p.permalink,
    });
  }

  return days;
}
