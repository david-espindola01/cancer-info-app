import { PageTransition } from "./page-transition";
import { STARTING_TOPIC } from "./starting-topic";
import { TopicContent } from "./topic-content";

export default function Home() {
  return (
    <PageTransition>
      <TopicContent slug={STARTING_TOPIC} />
    </PageTransition>
  );
}
