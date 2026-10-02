import { Skeleton } from "@/components/ui/skeleton";
import { StatTilesSkeleton, ChartSkeleton } from "@/components/skeletons";
import { Card, CardContent } from "@/components/ui/card";

export default function OverviewLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <StatTilesSkeleton count={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-9 w-28" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="aspect-9/16 w-32 rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}
