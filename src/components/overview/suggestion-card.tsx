"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Image as ImageIcon, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBadge } from "@/components/icon-badge";
import { ScheduleSuggestionButton } from "@/components/overview/schedule-suggestion-button";
import { formatDate } from "@/lib/format";

interface Suggestion {
  id: string;
  date: string;
  type: string;
  hook: string | null;
  script: string | null;
  concept: string | null;
  caption: string | null;
}

export function SuggestionCard({ suggestions }: { suggestions: Suggestion[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState(false);

  const activeIndex = Math.min(index, suggestions.length - 1);
  const suggestion = suggestions[activeIndex];

  async function setStatus(status: "used" | "dismissed") {
    if (!suggestion) return;
    setPending(true);
    try {
      await fetch(`/api/suggestions/${suggestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (!suggestion) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconBadge icon={Sparkles} color="magenta" size="sm" />
            Today&apos;s suggestion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No suggestion available right now - you&apos;ve used or dismissed today&apos;s. New
            ones land after tomorrow&apos;s scheduled Planning run, or trigger it now from the
            Agents tab (Idea, then Planning).
          </p>
        </CardContent>
      </Card>
    );
  }

  const isPost = suggestion.type === "post";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconBadge icon={isPost ? ImageIcon : Sparkles} color="magenta" size="sm" />
            Today&apos;s suggestion
            <Badge variant="outline" className="font-normal">
              {isPost ? "Post" : "Reel"}
            </Badge>
          </CardTitle>
          {suggestions.length > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={activeIndex === 0}
                onClick={() => setIndex((i) => i - 1)}
                aria-label="Previous suggestion"
              >
                <ChevronLeft />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {activeIndex + 1}/{suggestions.length}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={activeIndex === suggestions.length - 1}
                onClick={() => setIndex((i) => i + 1)}
                aria-label="Next suggestion"
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{formatDate(suggestion.date)}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isPost ? (
          <>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Concept</p>
              <p className="text-sm font-medium">{suggestion.concept}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Caption</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {suggestion.caption}
              </p>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Hook</p>
              <p className="text-sm font-medium">{suggestion.hook}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Script</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {suggestion.script}
              </p>
            </div>
          </>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={pending} onClick={() => setStatus("used")}>
            <Check /> Mark as used
          </Button>
          <ScheduleSuggestionButton
            suggestionId={suggestion.id}
            contentType={isPost ? "post" : "reel"}
            title={(isPost ? suggestion.concept : suggestion.hook) ?? ""}
            notes={(isPost ? suggestion.caption : suggestion.script) ?? ""}
          />
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("dismissed")}>
            <X /> Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
