import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/skeletons";

export default function ReportsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeaderSkeleton />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-lg" />
      ))}
    </div>
  );
}
