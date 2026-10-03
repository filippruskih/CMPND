import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.competitor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
