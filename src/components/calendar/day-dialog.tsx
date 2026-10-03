"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CalendarDay } from "@/lib/calendar";
import { formatDate } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  drafted: "Drafted",
  posted: "Posted",
  skipped: "Skipped",
};

type Entry = CalendarDay["entries"][number];

function EntryForm({
  dateKey,
  entry,
  onDone,
}: {
  dateKey: string;
  entry?: Entry;
  onDone: () => void;
}) {
  const router = useRouter();
  const [contentType, setContentType] = useState(entry?.contentType ?? "reel");
  const [title, setTitle] = useState(entry?.title ?? "");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (entry) {
        await fetch(`/api/calendar/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, notes }),
        });
      } else {
        await fetch("/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: dateKey, contentType, title, notes }),
        });
      }
      router.refresh();
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      {!entry && (
        <div className="flex flex-col gap-1.5">
          <Label>Type</Label>
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reel">Reel</SelectItem>
              <SelectItem value="post">Post</SelectItem>
              <SelectItem value="story">Story</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label>{contentType === "reel" ? "Hook" : "Concept"}</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's the idea?" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Script, caption, or any other notes"
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
          {saving ? "Saving…" : entry ? "Save" : "Add to this day"}
        </Button>
        {entry && (
          <Button size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

function EntryRow({ dateKey, entry }: { dateKey: string; entry: Entry }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleStatusChange(status: string) {
    await fetch(`/api/calendar/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Remove this planned entry?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/calendar/${entry.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return <EntryForm dateKey={dateKey} entry={entry} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Badge variant="outline" className="mb-1">
            {entry.contentType === "post" ? "Post" : entry.contentType === "story" ? "Story" : "Reel"}
          </Badge>
          <p className="text-sm font-medium">{entry.title}</p>
          {entry.notes && <p className="text-sm text-muted-foreground">{entry.notes}</p>}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="Edit">
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} disabled={deleting} aria-label="Delete">
            <Trash2 />
          </Button>
        </div>
      </div>
      <Select value={entry.status} onValueChange={handleStatusChange}>
        <SelectTrigger size="sm" className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function DayDialog({
  dateKey,
  day,
  open,
  onOpenChange,
}: {
  dateKey: string;
  day: CalendarDay | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [addingNew, setAddingNew] = useState(false);
  const entries = day?.entries ?? [];
  const published = day?.published ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setAddingNew(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{formatDate(new Date(`${dateKey}T00:00:00Z`))}</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
          {published.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">Actually posted</p>
              {published.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border p-2">
                  {p.thumbnailUrl && (
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image src={p.thumbnailUrl} alt="" fill sizes="48px" className="object-cover" />
                    </div>
                  )}
                  <p className="line-clamp-2 flex-1 text-sm">{p.caption ?? "No caption"}</p>
                  <Link href={p.permalink} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                    <ExternalLink className="size-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}

          {entries.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">Planned</p>
              {entries.map((entry) => (
                <EntryRow key={entry.id} dateKey={dateKey} entry={entry} />
              ))}
            </div>
          )}

          {addingNew ? (
            <EntryForm dateKey={dateKey} onDone={() => setAddingNew(false)} />
          ) : (
            <Button size="sm" variant="outline" className="w-fit" onClick={() => setAddingNew(true)}>
              <Plus /> Plan something for this day
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
