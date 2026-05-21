/** Shared loading skeletons for dashboard pages */

import type { CSSProperties } from "react";

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-700/50 ${className}`}
      style={style}
      aria-hidden
    />
  );
}

export function KpiGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="fintech-panel p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-28" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function MetricPillsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ChartAreaSkeleton({ className = "min-h-[220px]" }: { className?: string }) {
  return (
    <div className={`glass-card flex flex-col justify-end gap-2 p-5 ${className}`}>
      <Skeleton className="h-3 w-32" />
      <div className="mt-4 flex h-40 items-end gap-2">
        {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="glass-card p-4">
      <Skeleton className="mb-4 h-5 w-40" />
      <div className="space-y-2">
        <div className="flex gap-3 border-b border-slate-200 pb-2 dark:border-slate-800">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-3 py-1">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="glass-card p-4">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="glass-card p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function FormPanelSkeleton() {
  return (
    <div className="glass-card space-y-4 p-5">
      <Skeleton className="h-5 w-36" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-1 h-10 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

export function TwoColumnSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ListSkeleton items={3} />
      <ListSkeleton items={3} />
    </div>
  );
}

export function SidebarNavSkeleton({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`flex h-screen flex-col border-r border-slate-200/80 bg-white/80 px-4 py-6 dark:border-slate-800/80 dark:bg-slate-950/85 ${className}`}
    >
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="mt-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </aside>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <FormPanelSkeleton />
      <div className="glass-card space-y-3 p-5">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
