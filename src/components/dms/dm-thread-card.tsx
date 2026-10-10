"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

interface DmThread {
  id: string;
  igThreadId: string;
  participantUsername: string | null;
  category: string | null;
  draftReply: string | null;
  draftStatus: string;
  lastMessageAt: string;
  messages: { id: string; fromUser: boolean; text: string | null; sentAt: string }[];
}

export function DmThreadCard({ thread }: { thread: DmThread }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  async function setStatus(draftStatus: "sent" | "dismissed") {
    setPending(true);
    try {
      await fetch(`/api/dm-threads/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftStatus }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function copyDraft() {
    if (!thread.draftReply) return;
    await navigator.clipboard.writeText(thread.draftReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const lastMessage = thread.messages.at(-1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            {thread.participantUsername ?? thread.igThreadId ?? "Unknown"}
          </CardTitle>
          <div className="flex items-center gap-2">
            {thread.category && <Badge variant="outline">{thread.category}</Badge>}
            <Badge variant={thread.draftStatus === "drafted" ? "secondary" : "outline"}>
              {thread.draftStatus}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Last message {formatDate(thread.lastMessageAt)}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {lastMessage && (
          <p className="text-sm text-muted-foreground">
            {lastMessage.fromUser ? "Them: " : "You: "}
            {lastMessage.text ?? "(no text)"}
          </p>
        )}

        {thread.draftReply && (
          <div className="rounded-xl bg-muted/50 p-3.5">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Suggested reply
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
              {thread.draftReply}
            </p>
          </div>
        )}

        {thread.draftStatus === "drafted" && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copyDraft} disabled={pending}>
              <Copy /> {copied ? "Copied!" : "Copy draft"}
            </Button>
            <Button size="sm" disabled={pending} onClick={() => setStatus("sent")}>
              <Check /> Mark as sent
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("dismissed")}>
              <X /> Dismiss
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
