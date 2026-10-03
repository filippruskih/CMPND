import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatSignedCompactNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ICON_COLORS, IconBadge, type IconBadgeColor } from "@/components/icon-badge";

export function StatTile({
  label,
  value,
  delta,
  deltaGoodDirection = "up",
  icon: Icon,
  color = "blue",
  footer,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaGoodDirection?: "up" | "down";
  icon?: LucideIcon;
  color?: IconBadgeColor;
  footer?: ReactNode;
}) {
  const isGood = delta != null && (deltaGoodDirection === "up" ? delta >= 0 : delta <= 0);

  return (
    <Card className="relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${ICON_COLORS[color]}, transparent)` }}
      />
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon && <IconBadge icon={Icon} color={color} size="sm" />}
        </div>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
        {delta != null && (
          <p className={cn("text-xs font-medium", isGood ? "text-delta-good" : "text-destructive")}>
            {formatSignedCompactNumber(delta)} vs previous sync
          </p>
        )}
        {footer}
      </CardContent>
    </Card>
  );
}
