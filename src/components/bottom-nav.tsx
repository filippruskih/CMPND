"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { bottomNavItems, isNavItemActive, type NavItem } from "@/lib/nav-items";
import { ScannerUploadDialog } from "@/components/scanner/scanner-upload-dialog";
import { cn } from "@/lib/utils";

// Split around the center "+" action — 2 tabs before it (Home, Content),
// 3 after (Insights, Agents, Profile), same asymmetry Instagram itself
// has around its own create button.
const BEFORE_CENTER = 2;

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.url}
      aria-label={item.title}
      className={cn(
        "flex w-14 flex-col items-center gap-0.5 rounded-2xl py-1.5 transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <item.icon className="size-5.5" strokeWidth={active ? 2.4 : 1.8} />
      <span className={cn("text-[0.65rem] leading-none", active ? "font-semibold" : "font-medium")}>
        {item.title}
      </span>
    </Link>
  );
}

// Floating pill, inset from the screen edges — sitting flush against the
// bottom edge put it right where iOS's home-indicator swipe gesture lives,
// making it too easy to trigger that instead of tapping a tab. A label
// under every icon plus a colored active state (rather than tooltip-only
// discoverability, which doesn't exist on touch) — the center "+" stays
// filled/primary-colored to read as the one clearly different action.
export function BottomNav() {
  const pathname = usePathname();
  const before = bottomNavItems.slice(0, BEFORE_CENTER);
  const after = bottomNavItems.slice(BEFORE_CENTER);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
    >
      <div className="flex w-full max-w-sm items-center justify-around rounded-3xl border border-foreground/[0.06] bg-background/95 px-2 py-1.5 shadow-[0_8px_30px_-8px_rgba(20,20,10,0.25)] backdrop-blur-sm supports-backdrop-filter:bg-background/90">
        {before.map((item) => (
          <NavLink key={item.key} item={item} active={isNavItemActive(item, pathname)} />
        ))}
        <ScannerUploadDialog />
        {after.map((item) => (
          <NavLink key={item.key} item={item} active={isNavItemActive(item, pathname)} />
        ))}
      </div>
    </nav>
  );
}
