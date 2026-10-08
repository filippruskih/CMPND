import Link from "next/link";
import { Activity, FileText, FlaskConical, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// A menu rather than a growing row of individual buttons - consolidating
// here instead of letting the PageHeader action row keep growing with
// every new analytics surface.
export function MoreToolsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <MoreHorizontal /> More
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/retention">
            <Activity /> Retention
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/experiments">
            <FlaskConical /> Growth experiments
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/reports">
            <FileText /> Daily reports
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
