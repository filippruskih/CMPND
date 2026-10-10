"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UploadForm } from "@/components/scanner/upload-form";

// The bottom nav's center action — Instagram's own "+" pattern, opening a
// dialog directly instead of navigating to a page first. Kept monochrome
// (filled foreground circle) rather than the brand gradient, matching the
// existing rule that color is reserved for the logo alone; the filled
// shape (vs. the other tabs' plain glyphs) is what makes it read as the
// primary action.
export function ScannerUploadDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Scan a draft reel"
            onClick={() => setOpen(true)}
            className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_18px_-4px_var(--primary)] transition-transform active:scale-95"
          >
            <Plus className="size-6" strokeWidth={2.4} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Scan a draft reel</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan a draft reel</DialogTitle>
          <DialogDescription>
            Upload an in-progress reel to get frame-by-frame feedback, a recommended hook, and a
            caption before you post it.
          </DialogDescription>
        </DialogHeader>
        <UploadForm onUploaded={() => setOpen(false)} />
        <Link
          href="/scanner"
          onClick={() => setOpen(false)}
          className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          View past scans
        </Link>
      </DialogContent>
    </Dialog>
  );
}
