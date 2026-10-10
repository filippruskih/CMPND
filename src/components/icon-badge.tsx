import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Fixed categorical assignment (never cycled per-instance) so the same
// entity always carries the same color everywhere it appears — e.g.
// "Followers" is always chart-1 blue, the Analytics agent is always
// chart-1 blue, wherever they show up in the app.
export const ICON_COLORS = {
  blue: "var(--chart-1)",
  orange: "var(--chart-2)",
  aqua: "var(--chart-3)",
  yellow: "var(--chart-4)",
  magenta: "var(--chart-5)",
} as const;

export type IconBadgeColor = keyof typeof ICON_COLORS;

export function IconBadge({
  icon: Icon,
  color = "blue",
  size = "md",
  className,
}: {
  icon: LucideIcon;
  color?: IconBadgeColor;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl",
        size === "sm" ? "size-8" : "size-10",
        className
      )}
      style={{
        background: `color-mix(in oklab, ${ICON_COLORS[color]} 22%, white)`,
        color: `color-mix(in oklab, ${ICON_COLORS[color]} 85%, black 8%)`,
      }}
    >
      <Icon className={size === "sm" ? "size-4" : "size-5"} strokeWidth={2.25} />
    </div>
  );
}
