import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID_STATUSES = new Set(["planned", "drafted", "posted", "skipped"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const data: { title?: string; notes?: string | null; status?: string; date?: Date } = {};

  if ("title" in body) {
    if (typeof body.title !== "string" || !body.title) {
      return NextResponse.json({ error: "title must be a non-empty string" }, { status: 400 });
    }
    data.title = body.title;
  }
  if ("notes" in body) {
    data.notes = typeof body.notes === "string" ? body.notes : null;
  }
  if ("status" in body) {
    if (!VALID_STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
  }
  if ("date" in body) {
    data.date = new Date(body.date);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const entry = await db.calendarEntry.update({ where: { id }, data });
  return NextResponse.json(entry);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.calendarEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
