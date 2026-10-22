"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { QueuePlace } from "./connection-status";
import { TopicSkeleton } from "./topic-skeleton";

/**
 * While the page is being prepared (or waits in line for the AI), asks the server for it
 * again every `retryMs`. It must keep asking: the server often answers with the same wait,
 * and a request that stops asking loses its place in line.
 */
export function TopicWaiting({ retryMs, place }: { retryMs: number; place: QueuePlace }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), retryMs);
    return () => clearInterval(timer);
  }, [router, retryMs]);

  return <TopicSkeleton place={place} />;
}
