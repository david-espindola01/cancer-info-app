import Link from "next/link";
import { Hills, SunMark } from "@/ui/icons";
import { SITE_NAME, SITE_TAGLINE } from "../site";
import { OfflineNotice } from "./connection-status";
import { FreeQuestion } from "./free-question";
import { ServiceWorker } from "./service-worker";

/** Frame of the topic pages: site name, «Mis temas», content, free question and notice. */
export default function TopicsLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 pt-5">
      {/* It stays still during transitions: it is the reference point of the journey. */}
      <header style={{ viewTransitionName: "site-header" }} className="flex items-center gap-3">
        <Link href="/" transitionTypes={["back"]} className="flex flex-1 items-center gap-2 leading-tight">
          <SunMark />
          <span>
            <span className="block text-xl font-extrabold text-accent">{SITE_NAME}</span>
            <span className="block text-sm font-semibold text-muted">{SITE_TAGLINE}</span>
          </span>
        </Link>
        <Link
          href="/mis-temas"
          transitionTypes={["forward"]}
          className="color-monte solid rounded-full px-4 py-1.5 text-base font-extrabold"
        >
          Mis temas
        </Link>
      </header>
      <ServiceWorker />
      <OfflineNotice />
      <main className="flex flex-col gap-4">
        {children}
      </main>
      <FreeQuestion />
      {/* The page ends in the hills, like the titles. */}
      <footer className="-mx-4 mt-auto text-base">
        <Hills className="block h-10 w-full text-(--colina)" />
        <p className="bg-(--colina) px-4 pb-8 pt-1 text-[#fff6e9]">
          Información educativa basada en artículos científicos. No reemplaza la consulta con un profesional de salud.
        </p>
      </footer>
    </div>
  );
}
