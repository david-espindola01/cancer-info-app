import Link from "next/link";
import { OfflineNotice } from "./connection-status";
import { FreeQuestion } from "./free-question";
import { ListenButton } from "./listen-button";

/** Frame of the topic pages: site name, content, free question and notice. */
export default function TopicsLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6">
      {/* It stays still during transitions: it is the reference point of the journey. */}
      <header style={{ viewTransitionName: "site-header" }} className="flex items-center gap-2">
        <span aria-hidden className="size-3 rotate-45 rounded-sm bg-accent" />
        <Link href="/" transitionTypes={["back"]} className="font-bold text-accent">
          Información sobre el cáncer
        </Link>
      </header>
      <OfflineNotice />
      <main className="flex flex-col gap-4">
        <ListenButton />
        {children}
      </main>
      <FreeQuestion />
      <footer className="border-t border-border pt-4 text-base text-muted">
        Información educativa basada en artículos científicos. No reemplaza la consulta con un profesional de salud.
      </footer>
    </div>
  );
}
