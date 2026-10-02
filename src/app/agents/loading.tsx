import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/skeletons";

export default function AgentsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeaderSkeleton />
      <Skeleton className="h-36 w-full rounded-lg" />
      <CardGridSkeleton count={6} columns="md:grid-cols-2" aspect="h-28" />
    </div>
  );
}
