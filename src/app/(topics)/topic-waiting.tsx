"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { QueuePlace } from "./connection-status";
import { TopicSkeleton } from "./topic-skeleton";

/** While the page is being prepared (or the AI hit its limit), asks the server for it again. */
export function TopicWaiting({ retryMs, place }: { retryMs: number; place: QueuePlace }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.refresh(), retryMs);
    return () => clearTimeout(timer);
  }, [router, retryMs]);

  return <TopicSkeleton place={place} />;
}
