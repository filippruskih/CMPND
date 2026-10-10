import Link from "next/link";
import { Activity, FileText, FlaskConical, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Overview", href: "/insights", icon: TrendingUp },
  { key: "retention", label: "Retention", href: "/retention", icon: Activity },
  { key: "experiments", label: "Experiments", href: "/experiments", icon: FlaskConical },
  { key: "reports", label: "Reports", href: "/reports", icon: FileText },
] as const;

// Insights, Retention, Growth experiments, and Daily reports are separate
// real pages, but presented as one switchable group - replaces a "More"
// dropdown that had to be opened every time to reach any of them, same
// reasoning as ContentTabs for Reels/Posts/Series/Calendar.
export function InsightsTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <div className="flex w-full gap-1 overflow-x-auto rounded-xl bg-muted p-1 sm:w-fit">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
