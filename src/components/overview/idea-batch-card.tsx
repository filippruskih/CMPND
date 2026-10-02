import { Compass, Sparkle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBadge } from "@/components/icon-badge";
import { formatDate } from "@/lib/format";
import type { IdeaItem } from "@/lib/idea-batch";

function IdeaList({ items }: { items: IdeaItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">None this round.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">{item.concept}</p>
          <p className="text-sm text-muted-foreground">{item.why}</p>
        </div>
      ))}
    </div>
  );
}

export function IdeaBatchCard({
  nicheIdeas,
  freshIdeas,
  generatedAt,
}: {
  nicheIdeas: IdeaItem[];
  freshIdeas: IdeaItem[];
  generatedAt: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Where to point your next reel</CardTitle>
        <p className="text-xs text-muted-foreground">
          From the Idea agent&apos;s last run, {formatDate(generatedAt)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <IconBadge icon={Compass} color="aqua" size="sm" />
              <span className="text-sm font-medium">From your niche</span>
            </div>
            <IdeaList items={nicheIdeas} />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <IconBadge icon={Sparkle} color="orange" size="sm" />
              <span className="text-sm font-medium">Trending now, new territory</span>
            </div>
            <IdeaList items={freshIdeas} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
