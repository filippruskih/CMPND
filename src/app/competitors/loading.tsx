import { PageHeaderSkeleton, ListCardSkeleton } from "@/components/skeletons";

export default function CompetitorsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeaderSkeleton />
      <ListCardSkeleton count={4} />
    </div>
  );
}
