import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, ContentTabsSkeleton } from "@/components/skeletons";

export default function CalendarLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeaderSkeleton />
      <ContentTabsSkeleton />
      <Skeleton className="h-7 w-32" />
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}
