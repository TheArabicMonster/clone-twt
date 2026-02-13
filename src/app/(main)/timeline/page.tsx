"use client";

import { ComposeTweet } from "@/components/ComposeTweet";

export default function TimelinePage() {
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold">Timeline</h1>

      <ComposeTweet />
    </div>
  );
}
