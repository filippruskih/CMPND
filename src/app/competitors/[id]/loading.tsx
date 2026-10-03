import { Skeleton } from "@/components/ui/skeleton";
import { BackLinkSkeleton, ChartSkeleton, CardGridSkeleton } from "@/components/skeletons";

export default function CompetitorDetailLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <BackLinkSkeleton />
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-20" />
      </div>
      <ChartSkeleton />
      <CardGridSkeleton count={6} aspect="aspect-square" />
    </div>
  );
}
