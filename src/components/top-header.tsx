"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { AppLogoMark } from "@/components/app-logo-mark";
import { headerNavItem, getActiveNavItem } from "@/lib/nav-items";

export function TopHeader() {
  const pathname = usePathname();
  const active = getActiveNavItem(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2.5 border-b bg-background/85 px-4 backdrop-blur-sm supports-backdrop-filter:bg-background/70 md:px-6">
      <Link href="/" className="flex items-center gap-2.5">
        <div
          className="flex aspect-square size-7 shrink-0 items-center justify-center rounded-lg text-white"
          style={{ background: "#B9C6AE" }}
        >
          <AppLogoMark className="size-4" />
        </div>
        <span className="font-semibold">{active.title}</span>
      </Link>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" asChild aria-label="DMs">
          <Link href={headerNavItem.url}>
            <headerNavItem.icon />
          </Link>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
