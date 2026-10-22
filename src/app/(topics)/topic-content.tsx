import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after, connection } from "next/server";
import { topics } from "@/infrastructure/container";
import { GeneratedPage } from "@/ui/generated-page";
import { visitorIp } from "../visitor-ip";
import { TopicWaiting } from "./topic-waiting";

/**
 * Content of a topic's page, resolved on the server: if it is cached it arrives as ready
 * HTML (readable even if the JavaScript takes long to load on a slow network).
 */
export async function TopicContent({ slug }: { slug: string }) {
  // Always at request time: the database and the AI are never queried at build time.
  await connection();
  const result = await topics.get(slug, visitorIp(await headers()));

  switch (result.kind) {
    case "invalid":
      notFound();
    case "error":
      return (
        <p role="alert" className="font-semibold">
          No pudimos preparar esta página ahora. Intenta de nuevo en unos minutos.
        </p>
      );
    case "limit":
      return (
        <p role="alert" className="font-semibold">
          Pediste muchas páginas nuevas en poco tiempo. Espera unos minutos y vuelve a intentarlo; mientras tanto
          puedes seguir leyendo las páginas que ya están listas.
        </p>
      );
    case "preparing":
      return <TopicWaiting retryMs={result.retryMs} />;
    case "ready": {
      const { page, stale } = result;
      // After answering: this page is refreshed if needed and the next ones are prepared,
      // one after another so they do not compete for the AI's per-minute limit.
      after(async () => {
        if (stale) await topics.regenerate(page.slug);
        await topics.prefetch(page.keywords);
      });
      return <GeneratedPage ui={page.ui} sources={page.sources} />;
    }
  }
}
