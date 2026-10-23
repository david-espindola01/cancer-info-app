import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import type { TopicSummary } from "@/domain/page";
import { topics } from "@/infrastructure/container";
import { MyTopics } from "./my-topics";

export const metadata: Metadata = { title: "Mis temas · Información sobre el cáncer" };

/** The topics ready on the server; if they cannot be read, the page shows only what is on the phone. */
async function ReadyTopics() {
  await connection();
  let ready: TopicSummary[] = [];
  try {
    ready = await topics.ready();
  } catch {
    // Without the list, the read and saved topics are still useful.
  }
  return <MyTopics ready={ready} />;
}

export default function MyTopicsPage() {
  return (
    <Suspense fallback={<MyTopics ready={[]} />}>
      <ReadyTopics />
    </Suspense>
  );
}
