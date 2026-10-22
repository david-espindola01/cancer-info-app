import { LoadingMessage, type QueuePlace } from "./connection-status";

/** What is shown while a page is being prepared: light, without images. */
export function TopicSkeleton({ place }: { place?: QueuePlace }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <LoadingMessage place={place} />
      <div aria-hidden className="flex animate-pulse flex-col gap-3">
        <div className="h-9 w-3/4 rounded bg-border" />
        <div className="h-4 w-full rounded bg-border" />
        <div className="h-4 w-11/12 rounded bg-border" />
        <div className="h-4 w-4/5 rounded bg-border" />
      </div>
    </div>
  );
}
