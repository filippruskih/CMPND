import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeaderSkeleton, ContentTabsSkeleton, StatTilesSkeleton, ChartSkeleton } from "@/components/skeletons";

export default function InsightsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeaderSkeleton />
      <ContentTabsSkeleton />
      <Skeleton className="h-28 w-full rounded-lg" />
      <div className="grid gap-4 md:grid-cols-2">
        <StatTilesSkeleton count={2} />
        <Card>
          <CardContent className="flex flex-col gap-2 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
        <div className="md:col-span-2">
          <ChartSkeleton />
        </div>
      </div>
      <div className="mt-4 border-t pt-8">
        <PageHeaderSkeleton />
        <div className="mt-4 flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
