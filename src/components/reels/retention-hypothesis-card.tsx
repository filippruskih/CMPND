"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBadge } from "@/components/icon-badge";
import { formatDate } from "@/lib/format";

export function RetentionHypothesisCard({
  reelId,
  initialAnalysis,
  initialAnalyzedAt,
  canRun,
}: {
  reelId: string;
  initialAnalysis: string | null;
  initialAnalyzedAt: string | null;
  canRun: boolean;
}) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [analyzedAt, setAnalyzedAt] = useState(initialAnalyzedAt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reels/${reelId}/retention-analysis`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Analysis failed");
      setAnalysis(body.analysis);
      setAnalyzedAt(new Date().toISOString());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconBadge icon={Activity} color="aqua" size="sm" />
            Retention breakdown
            <Badge variant="outline" className="font-normal">
              AI hypothesis
            </Badge>
          </CardTitle>
          {analysis && canRun && (
            <Button size="sm" variant="outline" onClick={runAnalysis} disabled={loading}>
              <RefreshCw className={loading ? "animate-spin" : ""} />
              Regenerate
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Instagram exposes no per-second retention curve to anyone, including you - this is an
          AI hypothesis about where viewers likely dropped off, reasoned from this reel&apos;s
          actual frames and its one real average-retention number, not measured data.
        </p>
        {analyzedAt && (
          <p className="text-xs text-muted-foreground">Generated {formatDate(analyzedAt)}</p>
        )}
      </CardHeader>
      <CardContent>
        {analysis ? (
          <p className="whitespace-pre-wrap text-sm">{analysis}</p>
        ) : !canRun ? (
          <p className="text-sm text-muted-foreground">
            Needs both a synced reel length and an average watch time first.
          </p>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Pulls this reel&apos;s actual frames from Instagram and reasons about likely
              drop-off points - takes longer than a text-only analysis since it processes video.
            </p>
            <Button size="sm" onClick={runAnalysis} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Activity />}
              {loading ? "Analyzing…" : "Run analysis"}
            </Button>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
