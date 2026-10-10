import { Card, CardContent } from "@/components/ui/card";
import { formatCompactNumber } from "@/lib/format";

const METRIC_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function DetailMetric({
  label,
  value,
  index,
  format = (v: number) => formatCompactNumber(v),
}: {
  label: string;
  value: number | null | undefined;
  index: number;
  format?: (value: number) => string;
}) {
  const color = METRIC_COLORS[index % METRIC_COLORS.length];
  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <CardContent className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {value != null ? format(value) : "-"}
        </p>
      </CardContent>
    </Card>
  );
}
