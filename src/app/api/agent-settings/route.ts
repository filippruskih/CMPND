import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAgentSettings } from "@/lib/agent-settings";

export async function GET() {
  const settings = await getAgentSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  if (typeof body.excludedTopics !== "string") {
    return NextResponse.json({ error: "excludedTopics must be a string" }, { status: 400 });
  }

  const existing = await getAgentSettings();
  const settings = await db.agentSettings.update({
    where: { id: existing.id },
    data: { excludedTopics: body.excludedTopics },
  });

  return NextResponse.json(settings);
}
