import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, ContentTabsSkeleton } from "@/components/skeletons";
import { Card, CardContent } from "@/components/ui/card";

export default function ExperimentsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeaderSkeleton />
      <ContentTabsSkeleton />
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton className="h-5 w-28" />
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-8 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
