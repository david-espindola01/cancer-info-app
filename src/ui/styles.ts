/** Classes shared by the catalog components (a single definition of each style). */
export const styles = {
  blockTitle: "text-xl font-bold",
  list: "mt-2 flex flex-col gap-2",
  /** Colored circle with light content (numbers, icons). */
  circle: "flex shrink-0 items-center justify-center rounded-full bg-(--c) font-bold text-background",
} as const;
