import { Suspense, ViewTransition, type ReactNode } from "react";
import { TopicSkeleton } from "./topic-skeleton";

const DIRECTIONS = { forward: "forward", back: "back", default: "none" } as const;

/**
 * Wraps a topic page's content with its animations (View Transitions): when navigating,
 * the page leaves and the new one slides in following the direction of the journey
 * (forward or back); while loading, the skeleton moves down and fades, and the content
 * moves up and appears. The styles are in globals.css.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={DIRECTIONS} exit={DIRECTIONS} default="none">
      <Suspense
        fallback={
          <ViewTransition exit="down" default="none">
            <TopicSkeleton />
          </ViewTransition>
        }
      >
        <ViewTransition enter="up" default="none">
          {children}
        </ViewTransition>
      </Suspense>
    </ViewTransition>
  );
}
