import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Reusable skeleton primitives used while dashboard data loads.
 * They preserve the spacing of the real components so layouts don't shift.
 */

export const SkeletonStatCard = ({ className }: { className?: string }) => (
  <div className={cn("bg-card rounded-2xl p-4 card-shadow border border-border/50", className)}>
    <div className="flex items-center gap-2 mb-3">
      <Skeleton className="w-6 h-6 rounded-md" />
      <Skeleton className="h-3 w-20" />
    </div>
    <Skeleton className="h-7 w-16 mb-2" />
    <Skeleton className="h-3 w-24" />
  </div>
);

export const SkeletonStatGrid = ({
  count = 4,
  className,
}: { count?: number; className?: string }) => (
  <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-4", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonStatCard key={i} />
    ))}
  </div>
);

export const SkeletonChartCard = ({
  height = 260,
  wide,
}: { height?: number; wide?: boolean }) => (
  <div className={cn("bg-card rounded-2xl p-5 card-shadow border border-border/50", wide && "lg:col-span-2")}>
    <div className="flex items-center justify-between mb-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-44" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <div className="relative overflow-hidden rounded-xl bg-muted/40" style={{ height }}>
      {/* Faux chart bars */}
      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-2 h-[80%]">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-md"
            style={{ height: `${30 + ((i * 17) % 65)}%` }}
          />
        ))}
      </div>
    </div>
  </div>
);

export const SkeletonTableRow = ({ cols = 5 }: { cols?: number }) => (
  <tr className="border-b border-border last:border-0">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-3 py-4">
        <Skeleton className={cn("h-4", i === 0 ? "w-6" : i === 1 ? "w-40" : "w-16 mx-auto")} />
      </td>
    ))}
  </tr>
);

export const SkeletonTable = ({
  rows = 6,
  cols = 5,
  headers,
}: { rows?: number; cols?: number; headers?: string[] }) => (
  <div className="bg-card rounded-2xl card-shadow overflow-hidden border border-border/50">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        {headers && (
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={headers?.length ?? cols} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const SkeletonListRow = () => (
  <div className="bg-card border border-border rounded-2xl p-5 card-shadow flex items-start justify-between gap-4">
    <div className="flex-1 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-56" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    <Skeleton className="h-8 w-24 rounded-lg" />
  </div>
);

export const SkeletonCardGrid = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-2xl p-5 card-shadow space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonPageHeader = () => (
  <div className="mb-6 space-y-2">
    <Skeleton className="h-7 w-56" />
    <Skeleton className="h-4 w-72" />
  </div>
);

/** Full-page skeleton mimicking the business dashboard chrome */
export const SkeletonAppShell = () => (
  <div className="min-h-screen soft-bg flex">
    <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border p-4 gap-3">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full rounded-lg" />
      ))}
    </aside>
    <main className="flex-1 p-4 md:p-8">
      <SkeletonPageHeader />
      <SkeletonStatGrid className="mb-6" />
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <SkeletonChartCard wide />
        <SkeletonChartCard height={260} />
      </div>
      <SkeletonTable rows={5} cols={5} />
    </main>
  </div>
);