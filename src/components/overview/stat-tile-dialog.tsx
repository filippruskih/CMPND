"use client";

import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MetricLineChart } from "@/components/metric-line-chart";

export function StatTileDialog({
  trigger,
  title,
  data,
  dataKey,
  label,
  percent = false,
}: {
  trigger: ReactNode;
  title: string;
  data: { date: string; value: number }[];
  dataKey: string;
  label: string;
  percent?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button type="button" onClick={() => setOpen(true)} className="w-full text-left">
        {trigger}
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {data.length > 1 ? (
          <MetricLineChart data={data} dataKey={dataKey} label={label} height={240} percent={percent} />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Appears once you have a couple of posted items with this data.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
