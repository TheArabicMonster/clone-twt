"use client";

import { Skeleton } from "@heroui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full">
      {/* Banniere */}
      <Skeleton className="h-48 w-full rounded-none" />

      {/* Avatar + infos */}
      <div className="px-4">
        <div className="-mt-16 flex items-end justify-between">
          <Skeleton className="h-32 w-32 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        <div className="mt-4 space-y-2">
          <Skeleton className="h-7 w-40 rounded-lg" />
          <Skeleton className="h-5 w-28 rounded-lg" />
        </div>

        <div className="mt-3">
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="mt-1 h-4 w-3/4 rounded-lg" />
        </div>

        <div className="mt-4 flex gap-4">
          <Skeleton className="h-5 w-24 rounded-lg" />
          <Skeleton className="h-5 w-24 rounded-lg" />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex border-b border-default-200">
        <Skeleton className="mx-4 h-10 w-20 rounded-lg" />
        <Skeleton className="mx-4 h-10 w-20 rounded-lg" />
        <Skeleton className="mx-4 h-10 w-20 rounded-lg" />
      </div>

      {/* Contenu */}
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2 rounded-lg border border-default-200 p-4">
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
