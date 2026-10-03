import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID_CONTENT_TYPES = new Set(["reel", "post"]);

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.date || typeof body.date !== "string") {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }
  if (!VALID_CONTENT_TYPES.has(body.contentType)) {
    return NextResponse.json({ error: "contentType must be 'reel' or 'post'" }, { status: 400 });
  }
  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const entry = await db.calendarEntry.create({
    data: {
      date: new Date(body.date),
      contentType: body.contentType,
      title: body.title,
      notes: typeof body.notes === "string" ? body.notes : null,
      sourceSuggestionId: typeof body.sourceSuggestionId === "string" ? body.sourceSuggestionId : null,
    },
  });

  if (entry.sourceSuggestionId) {
    await db.suggestion.update({
      where: { id: entry.sourceSuggestionId },
      data: { status: "used" },
    });
  }

  return NextResponse.json(entry);
}
