import { db } from "@/lib/db";
import { AGENT_REGISTRY, type AgentDefinitionConfig } from "./registry";
import { AgentSkip } from "./errors";

// Keeps AgentDefinition rows in sync with the registry. frequency/hour/
// dayOfWeek/dayOfMonth are user-controlled state (set from defaults only
// on first creation) and are intentionally never overwritten here.
export async function ensureAgentDefinitions() {
  for (const config of Object.values(AGENT_REGISTRY)) {
    await db.agentDefinition.upsert({
      where: { key: config.key },
      create: {
        key: config.key,
        name: config.name,
        description: config.description,
        frequency: config.defaultFrequency,
        hour: config.defaultHour,
      },
      update: {
        name: config.name,
        description: config.description,
      },
    });
  }
}

async function executeAgentRun(runId: string, config: AgentDefinitionConfig) {
  const log = async (message: string, level: "info" | "warn" | "error" = "info") => {
    await db.agentLogEntry.create({ data: { runId, level, message } });
  };

  try {
    const summary = await config.run({ runId, log });
    await db.agentRun.update({
      where: { id: runId },
      data: { status: "succeeded", finishedAt: new Date(), outputSummary: summary },
    });
  } catch (error) {
    if (error instanceof AgentSkip) {
      await db.agentRun.update({
        where: { id: runId },
        data: { status: "skipped", finishedAt: new Date(), outputSummary: error.message },
      });
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    await log(`Run failed: ${message}`, "error");
    await db.agentRun.update({
      where: { id: runId },
      data: { status: "failed", finishedAt: new Date(), outputSummary: message },
    });
  }
}

// Creates the AgentRun row synchronously and returns its id, then runs the
// agent's task in the background. This process is a long-lived local Next.js
// server (not a serverless function), so execution continues after the
// caller (an API route) has already sent its response.
export async function triggerAgentRun(key: string): Promise<string> {
  const config = AGENT_REGISTRY[key];
  if (!config) throw new Error(`Unknown agent: ${key}`);

  await ensureAgentDefinitions();
  const definition = await db.agentDefinition.findUniqueOrThrow({ where: { key } });

  const run = await db.agentRun.create({
    data: { agentId: definition.id, status: "running" },
  });

  executeAgentRun(run.id, config).catch((error) => {
    console.error(`[agents] ${key} run ${run.id} crashed`, error);
  });

  return run.id;
}
