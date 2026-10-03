"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResyncCompetitorButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      await fetch(`/api/competitors/${id}/sync`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleClick} disabled={loading} aria-label="Re-sync">
      {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
    </Button>
  );
}

export function DeleteCompetitorButton({ id, redirectTo }: { id: string; redirectTo?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Stop tracking this competitor? This deletes their synced history.")) return;
    setLoading(true);
    try {
      await fetch(`/api/competitors/${id}`, { method: "DELETE" });
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleClick} disabled={loading} aria-label="Stop tracking">
      {loading ? <Loader2 className="animate-spin" /> : <Trash2 />}
    </Button>
  );
}
