import { NextResponse } from "next/server";
import { analyzeReelPerformance } from "@/lib/agents/tasks/reel-performance";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const analysis = await analyzeReelPerformance(id);
    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
