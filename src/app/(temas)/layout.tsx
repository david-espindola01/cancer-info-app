import Link from "next/link";
import { BotonEscuchar } from "./boton-escuchar";
import { AvisoSinConexion } from "./estado-conexion";
import { PreguntaLibre } from "./pregunta-libre";

/** Marco de las páginas de temas: nombre del sitio, contenido, pregunta libre y aviso. */
export default function MarcoTemas({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6">
      {/* Queda quieto durante las transiciones: es el punto de referencia del recorrido. */}
      <header style={{ viewTransitionName: "encabezado-sitio" }} className="flex items-center gap-2">
        <span aria-hidden className="size-3 rotate-45 rounded-sm bg-acento" />
        <Link href="/" transitionTypes={["volver"]} className="font-bold text-acento">
          Información sobre el cáncer
        </Link>
      </header>
      <AvisoSinConexion />
      <main className="flex flex-col gap-4">
        <BotonEscuchar />
        {children}
      </main>
      <PreguntaLibre />
      <footer className="border-t border-borde pt-4 text-base text-tenue">
        Información educativa basada en artículos científicos. No reemplaza la consulta con un profesional de salud.
      </footer>
    </div>
  );
}
