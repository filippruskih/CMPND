"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SuggestedAccount {
  username: string;
  reason: string;
}

export function DiscoverAccountsDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<SuggestedAccount[] | null>(null);
  const [tracked, setTracked] = useState<Set<string>>(new Set());
  const [addingUsername, setAddingUsername] = useState<string | null>(null);

  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen && accounts === null && !loading) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/competitors/discover", { method: "POST" });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to find accounts");
        setAccounts(body.accounts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to find accounts");
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleTrack(username: string) {
    setAddingUsername(username);
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        setTracked((prev) => new Set(prev).add(username));
        router.refresh();
      }
    } finally {
      setAddingUsername(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Sparkles /> Find accounts
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suggested accounts to track</DialogTitle>
          <DialogDescription>
            Based on your content niche, found via a live web search. Review each before
            tracking - Claude can occasionally suggest an inactive or mismatched handle.
          </DialogDescription>
        </DialogHeader>
        {loading && <p className="text-sm text-muted-foreground">Searching the web…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {accounts && accounts.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">No suggestions found.</p>
        )}
        {accounts && accounts.length > 0 && (
          <div className="flex flex-col gap-2">
            {accounts.map((a) => {
              const isTracked = tracked.has(a.username);
              return (
                <div
                  key={a.username}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">@{a.username}</p>
                    <p className="text-xs text-muted-foreground">{a.reason}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isTracked ? "secondary" : "outline"}
                    disabled={isTracked || addingUsername === a.username}
                    onClick={() => handleTrack(a.username)}
                  >
                    {isTracked ? (
                      <>
                        <Check /> Tracking
                      </>
                    ) : (
                      <>
                        <Plus /> {addingUsername === a.username ? "Adding…" : "Track"}
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
