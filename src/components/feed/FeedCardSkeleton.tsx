import { Skeleton } from '@/components/ui/skeleton'

export function FeedCardSkeleton() {
  return (
    <div className="feed-item flex flex-col px-5 bg-[--card-bg]">
      <div className="flex-1 flex flex-col justify-center gap-4 pt-16">
        <Skeleton className="h-5 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-4/5" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <div className="pb-6 space-y-3">
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-12 rounded-lg" />
          <Skeleton className="flex-1 h-12 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
