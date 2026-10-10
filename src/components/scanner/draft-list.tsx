import Link from "next/link";
import { Film } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DraftStatusBadge } from "@/components/scanner/status-badge";
import { DeleteDraftButton } from "@/components/scanner/delete-draft-button";
import { formatDate } from "@/lib/format";

interface DraftSummary {
  id: string;
  filename: string;
  status: string;
  createdAt: Date;
}

export function DraftList({ drafts }: { drafts: DraftSummary[] }) {
  return (
    <div className="flex flex-col gap-2">
      {drafts.map((draft) => (
        <Link key={draft.id} href={`/scanner/${draft.id}`}>
          <Card className="transition-all hover:-translate-y-0.5 hover:bg-muted/30">
            <CardContent className="flex items-center gap-3 py-3">
              <Film className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium">{draft.filename}</p>
                <p className="text-xs text-muted-foreground">{formatDate(draft.createdAt)}</p>
              </div>
              <DraftStatusBadge status={draft.status} />
              <DeleteDraftButton id={draft.id} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
