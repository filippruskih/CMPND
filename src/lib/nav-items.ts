import {
  Activity,
  Bot,
  FileText,
  FlaskConical,
  Grid3x3,
  Home,
  MessageCircle,
  ScanSearch,
  TrendingUp,
  User,
  type LucideIcon,
} from "lucide-react";
import type { IconBadgeColor } from "@/components/icon-badge";

export interface NavItem {
  key: string;
  title: string;
  url: string;
  icon: LucideIcon;
  color: IconBadgeColor;
  // Pathname prefixes that count as "this tab is active" — e.g. Content
  // covers /reels, /posts, /series and their detail pages even though its
  // own link points at /reels.
  matchPrefixes: string[];
}

// The five bottom-bar tabs, in display order — mirrors Instagram's own
// bottom nav (Home / grid-style content / notifications-ish / profile),
// adapted to this app's sections. Reels, Posts, and Series are three real
// pages grouped under one "Content" tab via the ContentTabs strip, rather
// than merged into a single page — each keeps its own pagination. The
// Scanner's own "+" trigger sits between Content and Insights in
// BottomNav itself (see bottom-nav.tsx) rather than living in this array —
// it opens an upload dialog directly instead of navigating to a page.
export const bottomNavItems: NavItem[] = [
  { key: "home", title: "Home", url: "/", icon: Home, color: "blue", matchPrefixes: ["/"] },
  {
    key: "content",
    title: "Content",
    url: "/reels",
    icon: Grid3x3,
    color: "orange",
    matchPrefixes: ["/reels", "/posts", "/series", "/calendar"],
  },
  {
    key: "insights",
    title: "Insights",
    url: "/insights",
    icon: TrendingUp,
    color: "aqua",
    matchPrefixes: ["/insights", "/content-dna"],
  },
  {
    key: "agents",
    title: "Agents",
    url: "/agents",
    icon: Bot,
    color: "yellow",
    matchPrefixes: ["/agents"],
  },
  {
    key: "profile",
    title: "Profile",
    url: "/profile",
    icon: User,
    color: "magenta",
    matchPrefixes: ["/profile", "/settings"],
  },
];

// DMs lives in the header (top-right icon), matching Instagram's own
// placement of the paper-plane/DM icon outside the bottom bar.
export const headerNavItem: NavItem = {
  key: "dms",
  title: "DMs",
  url: "/dms",
  icon: MessageCircle,
  color: "blue",
  matchPrefixes: ["/dms"],
};

// Not rendered as its own bottom-bar link (the "+" button in BottomNav
// opens a dialog instead) — kept only so the header title resolves
// correctly while viewing a scan's history or result page.
export const scannerNavItem: NavItem = {
  key: "scanner",
  title: "Scanner",
  url: "/scanner",
  icon: ScanSearch,
  color: "orange",
  matchPrefixes: ["/scanner"],
};

// Reached via the InsightsTabs switcher, not the bottom bar (which is
// already full) - kept here only so the header title resolves correctly
// while viewing it.
export const retentionNavItem: NavItem = {
  key: "retention",
  title: "Retention",
  url: "/retention",
  icon: Activity,
  color: "aqua",
  matchPrefixes: ["/retention"],
};

// Reached via a callout card on Overview, same reasoning as
// retentionNavItem above.
export const reportsNavItem: NavItem = {
  key: "reports",
  title: "Daily reports",
  url: "/reports",
  icon: FileText,
  color: "blue",
  matchPrefixes: ["/reports"],
};

// Reached via the InsightsTabs switcher, same reasoning as
// retentionNavItem above.
export const experimentsNavItem: NavItem = {
  key: "experiments",
  title: "Growth experiments",
  url: "/experiments",
  icon: FlaskConical,
  color: "magenta",
  matchPrefixes: ["/experiments"],
};

function isItemActive(item: NavItem, pathname: string): boolean {
  return item.matchPrefixes.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname.startsWith(prefix)
  );
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return isItemActive(item, pathname);
}

// Used by the header's small "you are here" breadcrumb.
export function getActiveNavItem(pathname: string): NavItem {
  return (
    [
      ...bottomNavItems,
      headerNavItem,
      scannerNavItem,
      retentionNavItem,
      reportsNavItem,
      experimentsNavItem,
    ].find((item) =>
      isItemActive(item, pathname)
    ) ?? bottomNavItems[0]
  );
}
