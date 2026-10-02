import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID_STATUSES = new Set(["done", "dismissed"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  if (!VALID_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await db.bestPractice.update({
    where: { id },
    data: { status: body.status, resolvedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
