import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncCompetitor } from "@/lib/instagram/competitor-sync";

export async function POST(request: Request) {
  const body = await request.json();
  const username = typeof body.username === "string" ? body.username.trim().replace(/^@/, "") : "";
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  const existing = await db.competitor.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: `@${username} is already tracked` }, { status: 400 });
  }

  const competitor = await db.competitor.create({ data: { username } });

  try {
    await syncCompetitor(competitor.id);
  } catch (error) {
    // Keep the row - a failed first sync still shows up with the error
    // visible, and can be retried, rather than silently never appearing.
    const message = error instanceof Error ? error.message : String(error);
    await db.competitor.update({ where: { id: competitor.id }, data: { lastSyncError: message } });
  }

  const final = await db.competitor.findUnique({ where: { id: competitor.id } });
  return NextResponse.json(final);
}
