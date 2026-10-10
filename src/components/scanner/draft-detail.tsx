"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DraftStatusBadge } from "@/components/scanner/status-badge";
import { DeleteDraftButton } from "@/components/scanner/delete-draft-button";

interface DraftAnalysis {
  breakdown: { area: string; suggestion: string }[];
  hook: string;
  caption: string;
}

interface DraftData {
  id: string;
  filename: string;
  status: string;
  error: string | null;
  analysis: DraftAnalysis | null;
}

const POLL_INTERVAL_MS = 2500;
const METRIC_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function DraftDetail({ initial }: { initial: DraftData }) {
  const [draft, setDraft] = useState(initial);
  const [regenerating, setRegenerating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPending = draft.status === "uploaded" || draft.status === "processing";

  useEffect(() => {
    async function refresh() {
      const res = await fetch(`/api/drafts/${draft.id}`, { cache: "no-store" });
      if (res.ok) setDraft(await res.json());
    }
    if (isPending && !pollRef.current) {
      pollRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    }
    if (!isPending && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isPending, draft.id]);

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      await fetch(`/api/drafts/${draft.id}/regenerate`, { method: "POST" });
      setDraft((d) => ({ ...d, status: "processing", analysis: null, error: null }));
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">{draft.filename}</h1>
          <div className="mt-1">
            <DraftStatusBadge status={draft.status} />
          </div>
        </div>
        <DeleteDraftButton id={draft.id} redirectTo="/scanner" />
      </div>

      <video
        src={`/api/drafts/${draft.id}/video`}
        controls
        playsInline
        className="max-h-[70vh] w-full rounded-2xl bg-black shadow-[0_16px_32px_-16px_rgba(20,20,10,0.4)]"
      />

      {isPending && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Analyzing your draft - extracting frames and comparing against your trend research and
            Content DNA. This can take a minute.
          </CardContent>
        </Card>
      )}

      {draft.status === "failed" && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-6 text-sm">
            <p className="text-destructive">Analysis failed: {draft.error || "Unknown error"}</p>
            <Button size="sm" variant="outline" className="w-fit" onClick={handleRegenerate} disabled={regenerating}>
              <RefreshCw className={regenerating ? "animate-spin" : ""} />
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {draft.status === "analyzed" && draft.analysis && (
        <div className="flex flex-col gap-4">
          <Button
            size="sm"
            variant="outline"
            className="w-fit"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            <RefreshCw className={regenerating ? "animate-spin" : ""} />
            {regenerating ? "Regenerating…" : "Don't like it? Regenerate"}
          </Button>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recommended hook</CardTitle>
              <CopyButton text={draft.analysis.hook} />
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-muted/50 p-3.5">
                <p className="text-base leading-snug font-semibold text-balance">{draft.analysis.hook}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Caption</CardTitle>
              <CopyButton text={draft.analysis.caption} />
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-muted/50 p-3.5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                  {draft.analysis.caption}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">What to change or add</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {draft.analysis.breakdown.map((item, i) => {
                const color = METRIC_COLORS[i % METRIC_COLORS.length];
                return (
                  <div
                    key={i}
                    className="flex flex-col gap-1 rounded-r-lg border-l-[3px] bg-muted/30 py-2 pr-3 pl-3"
                    style={{ borderColor: color }}
                  >
                    <Badge variant="outline" className="w-fit">
                      {item.area}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{item.suggestion}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
