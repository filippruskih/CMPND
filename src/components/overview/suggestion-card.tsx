"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, CircleDashed, Image as ImageIcon, Sparkles, X } from "lucide-react";
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
  const isStory = suggestion.type === "story";
  const usesConceptShape = isPost || isStory;
  const typeIcon = isPost ? ImageIcon : isStory ? CircleDashed : Sparkles;
  const typeLabel = isPost ? "Post" : isStory ? "Story" : "Reel";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconBadge icon={typeIcon} color="magenta" size="sm" />
            Today&apos;s suggestion
            <Badge variant="outline" className="font-normal">
              {typeLabel}
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
      <CardContent className="flex flex-col gap-4">
        {usesConceptShape ? (
          <>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Concept</p>
              <p className="mt-1 text-base leading-snug font-semibold text-balance">{suggestion.concept}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3.5">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {isStory ? "On-screen text" : "Caption"}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                {suggestion.caption}
              </p>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Hook</p>
              <p className="mt-1 text-base leading-snug font-semibold text-balance">{suggestion.hook}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3.5">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Script</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
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
            contentType={isPost ? "post" : isStory ? "story" : "reel"}
            title={(usesConceptShape ? suggestion.concept : suggestion.hook) ?? ""}
            notes={(usesConceptShape ? suggestion.caption : suggestion.script) ?? ""}
          />
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("dismissed")}>
            <X /> Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
