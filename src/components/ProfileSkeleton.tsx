"use client";

import { Skeleton } from "@heroui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="w-full">
      {/* Avatar + infos */}
      <div className="border-b border-default-200 px-6 py-12">
        <div className="flex items-center gap-4">
          <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
          <div className="flex flex-1 items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40 rounded-lg" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-28 rounded-lg" />
                <Skeleton className="h-5 w-32 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>

        <div className="mt-3">
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="mt-1 h-4 w-3/4 rounded-lg" />
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
