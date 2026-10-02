"use client";

import { useState } from "react";
import { Check, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { IconBadge } from "@/components/icon-badge";

export function ExcludedTopicsCard({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/agent-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excludedTopics: value }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <IconBadge icon={Ban} color="magenta" size="sm" />
          Topics to avoid
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          One topic or thing per line. The Idea and Planning agents will never suggest a reel or
          post touching these.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={"e.g.\npolitics\nmy ex\ncompetitor brand names"}
          rows={4}
        />
        <Button size="sm" onClick={handleSave} disabled={saving} className="w-fit">
          {saved ? <Check /> : null}
          {saved ? "Saved" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
