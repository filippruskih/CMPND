import Link from "next/link";
import { CalendarDays, Film, Image as ImageIcon, ListTree } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "reels", label: "Reels", href: "/reels", icon: Film },
  { key: "posts", label: "Posts", href: "/posts", icon: ImageIcon },
  { key: "series", label: "Series", href: "/series", icon: ListTree },
  { key: "calendar", label: "Calendar", href: "/calendar", icon: CalendarDays },
] as const;

// Reels, Posts, Series, and Calendar are separate real pages (each keeps
// its own pagination/data-fetching), but they're presented as one
// "Content" category from the bottom nav — this strip is what makes them
// feel like tabs of one section instead of unrelated destinations.
export function ContentTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
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
