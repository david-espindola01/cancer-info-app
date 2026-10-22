import { PageTransition } from "../../page-transition";
import { TopicContent } from "../../topic-content";

/** The slug may arrive encoded if someone types the address with accents. */
function decode(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export default function Topic({ params }: PageProps<"/topic/[slug]">) {
  return (
    <PageTransition>
      {params.then(({ slug }) => (
        <TopicContent slug={decode(slug)} />
      ))}
    </PageTransition>
  );
}
