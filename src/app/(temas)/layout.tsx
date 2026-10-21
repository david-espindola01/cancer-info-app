import Link from "next/link";
import { PreguntaLibre } from "./pregunta-libre";

/** Marco de las páginas de temas: nombre del sitio, contenido, pregunta libre y aviso. */
export default function MarcoTemas({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6">
      <header>
        <Link href="/" className="font-bold text-acento">
          Información sobre el cáncer
        </Link>
      </header>
      <main>{children}</main>
      <PreguntaLibre />
      <footer className="border-t border-borde pt-4 text-base text-tenue">
        Información educativa basada en artículos científicos. No reemplaza la consulta con un profesional de salud.
      </footer>
    </div>
  );
}
