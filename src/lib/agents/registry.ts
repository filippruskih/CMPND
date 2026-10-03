import { runSyncAgent } from "./tasks/sync";
import { runAnalyticsAgent } from "./tasks/analytics";
import { runTrendAgent } from "./tasks/trend";
import { runIdeaAgent } from "./tasks/idea";
import { runPlanningAgent } from "./tasks/planning";
import { runDmAgent } from "./tasks/dm";
import { runDailyReportAgent } from "./tasks/daily-report";

export interface AgentContext {
  runId: string;
  log: (message: string, level?: "info" | "warn" | "error") => Promise<void>;
}

export interface AgentDefinitionConfig {
  key: string;
  name: string;
  description: string;
  // Only used to seed a brand-new AgentDefinition row on first boot -
  // frequency/hour are user-controlled from there on and never
  // overwritten (see ensureAgentDefinitions). Staggered an hour apart so
  // each agent's output is ready before the next one that depends on it
  // runs (sync -> analytics -> trend -> idea -> planning).
  defaultFrequency: "off" | "daily";
  defaultHour: number;
  run: (ctx: AgentContext) => Promise<string>;
}

export const AGENT_REGISTRY: Record<string, AgentDefinitionConfig> = {
  sync: {
    key: "sync",
    name: "Instagram sync",
    description:
      "Pulls your latest reels, posts, follower count, and tracked competitors from Instagram automatically, every day.",
    defaultFrequency: "daily",
    defaultHour: 5,
    run: runSyncAgent,
  },
  analytics: {
    key: "analytics",
    name: "Analytics",
    description:
      "Crunches your reel performance daily, flags anomalies, and updates your Content DNA profile.",
    defaultFrequency: "daily",
    defaultHour: 6,
    run: runAnalyticsAgent,
  },
  trend: {
    key: "trend",
    name: "Trend scanner",
    description: "Researches current trends in your niche using web search.",
    defaultFrequency: "daily",
    defaultHour: 7,
    run: runTrendAgent,
  },
  idea: {
    key: "idea",
    name: "Idea creation",
    description: "Generates video ideas from current trends and your Content DNA.",
    defaultFrequency: "daily",
    defaultHour: 8,
    run: runIdeaAgent,
  },
  planning: {
    key: "planning",
    name: "Planning",
    description: "Turns the best idea into today's concrete hook and script.",
    defaultFrequency: "daily",
    defaultHour: 9,
    run: runPlanningAgent,
  },
  dm: {
    key: "dm",
    name: "DM manager",
    description:
      "Categorizes Instagram DMs and drafts suggested replies for you to review - never sends automatically.",
    defaultFrequency: "off",
    defaultHour: 10,
    run: runDmAgent,
  },
  dailyReport: {
    key: "dailyReport",
    name: "Daily report",
    description:
      "Synthesizes the day's sync, analytics, trend, idea, and planning results into one briefing - emailed if configured, always saved in-app.",
    defaultFrequency: "daily",
    defaultHour: 10,
    run: runDailyReportAgent,
  },
};
