import { PageTransition } from "./page-transition";
import { TopicContent } from "./topic-content";

/** The journey always starts here; from this topic, the page guides to the others. */
const STARTING_TOPIC = "que-es-el-cancer";

export default function Home() {
  return (
    <PageTransition>
      <TopicContent slug={STARTING_TOPIC} />
    </PageTransition>
  );
}
