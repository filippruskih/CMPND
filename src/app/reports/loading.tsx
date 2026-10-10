import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, ContentTabsSkeleton, StatTilesSkeleton } from "@/components/skeletons";
import { Card, CardContent } from "@/components/ui/card";

export default function ReportsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeaderSkeleton />
      <ContentTabsSkeleton />
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex flex-col gap-4 pt-6">
            <Skeleton className="h-5 w-32" />
            <StatTilesSkeleton count={4} />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
