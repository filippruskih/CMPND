"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBadge } from "@/components/icon-badge";
import { formatDate } from "@/lib/format";

export function ReelPerformanceCard({
  reelId,
  initialAnalysis,
  initialAnalyzedAt,
}: {
  reelId: string;
  initialAnalysis: string | null;
  initialAnalyzedAt: string | null;
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
      const res = await fetch(`/api/reels/${reelId}/analyze`, { method: "POST" });
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
            <IconBadge icon={Sparkles} color="aqua" size="sm" />
            Why this performed the way it did
          </CardTitle>
          {analysis && (
            <Button size="sm" variant="outline" onClick={runAnalysis} disabled={loading}>
              <RefreshCw className={loading ? "animate-spin" : ""} />
              Regenerate
            </Button>
          )}
        </div>
        {analyzedAt && (
          <p className="text-xs text-muted-foreground">Generated {formatDate(analyzedAt)}</p>
        )}
      </CardHeader>
      <CardContent>
        {analysis ? (
          <p className="whitespace-pre-wrap text-sm">{analysis}</p>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Get an AI explanation of why this reel over- or under-performed, grounded in the
              feedback-loop comparisons below.
            </p>
            <Button size="sm" onClick={runAnalysis} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {loading ? "Analyzing…" : "Run analysis"}
            </Button>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
