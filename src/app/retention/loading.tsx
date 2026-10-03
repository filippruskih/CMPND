import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, StatTilesSkeleton, ChartSkeleton } from "@/components/skeletons";

export default function RetentionLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeaderSkeleton />
      <StatTilesSkeleton count={2} />
      <ChartSkeleton />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  );
}
