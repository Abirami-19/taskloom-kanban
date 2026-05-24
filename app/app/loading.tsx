import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="grid min-h-screen grid-cols-[17rem_1fr] gap-0 p-3">
      <Skeleton className="h-full rounded-lg" />
      <div className="space-y-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-[50vh] w-full" />
      </div>
    </div>
  );
}
