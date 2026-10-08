import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureAgentDefinitions } from "@/lib/agents/runner";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  await ensureAgentDefinitions();

  const definition = await db.agentDefinition.findUnique({
    where: { key },
    include: {
      runs: {
        orderBy: { startedAt: "desc" },
        take: 5,
        include: { logs: { orderBy: { timestamp: "asc" } } },
      },
    },
  });

  if (!definition) {
    return NextResponse.json({ error: "Unknown agent" }, { status: 404 });
  }

  return NextResponse.json(definition);
}

const VALID_FREQUENCIES = new Set(["off", "daily", "weekly", "monthly"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const body = await request.json();

  const data: {
    frequency?: string;
    hour?: number;
    minute?: number;
    dayOfWeek?: number;
    dayOfMonth?: number;
  } = {};

  if ("frequency" in body) {
    if (!VALID_FREQUENCIES.has(body.frequency)) {
      return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
    }
    data.frequency = body.frequency;
  }
  if ("hour" in body) {
    const hour = Number(body.hour);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      return NextResponse.json({ error: "hour must be 0-23" }, { status: 400 });
    }
    data.hour = hour;
  }
  if ("minute" in body) {
    const minute = Number(body.minute);
    if (!Number.isInteger(minute) || minute < 0 || minute > 55 || minute % 5 !== 0) {
      return NextResponse.json({ error: "minute must be 0-55 in steps of 5" }, { status: 400 });
    }
    data.minute = minute;
  }
  if ("dayOfWeek" in body) {
    const dayOfWeek = Number(body.dayOfWeek);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({ error: "dayOfWeek must be 0-6" }, { status: 400 });
    }
    data.dayOfWeek = dayOfWeek;
  }
  if ("dayOfMonth" in body) {
    const dayOfMonth = Number(body.dayOfMonth);
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 28) {
      return NextResponse.json({ error: "dayOfMonth must be 1-28" }, { status: 400 });
    }
    data.dayOfMonth = dayOfMonth;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const definition = await db.agentDefinition.update({ where: { key }, data });
  return NextResponse.json(definition);
}
