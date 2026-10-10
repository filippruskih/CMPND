"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ListChecks, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBadge } from "@/components/icon-badge";

interface BestPractice {
  id: string;
  title: string;
  description: string;
}

function BestPracticeRow({ item }: { item: BestPractice }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function setStatus(status: "done" | "dismissed") {
    setPending(true);
    try {
      await fetch(`/api/best-practices/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl bg-muted/40 p-4">
      <div>
        <p className="text-sm font-semibold text-balance">{item.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("done")}>
          <Check /> Done
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus("dismissed")}>
          <X /> Dismiss
        </Button>
      </div>
    </div>
  );
}

export function BestPracticesCard({ items }: { items: BestPractice[] }) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <IconBadge icon={ListChecks} color="yellow" size="sm" />
          Worth doing
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          High-confidence recommendations from scanning your full content history - things you
          aren&apos;t already doing consistently.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item) => (
          <BestPracticeRow key={item.id} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}
