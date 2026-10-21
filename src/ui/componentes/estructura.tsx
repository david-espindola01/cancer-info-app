import { useId, type ReactNode } from "react";
import { TextoConTemas } from "../texto-con-temas";

export function Seccion({ titulo, children }: { titulo: string; children?: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="text-2xl font-bold">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export function Encabezado({ titulo, subtitulo }: { titulo: string; subtitulo: string | null }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{titulo}</h1>
      {subtitulo && <p className="text-xl text-tenue">{subtitulo}</p>}
    </header>
  );
}

export function Parrafo({ texto }: { texto: string }) {
  return (
    <p>
      <TextoConTemas texto={texto} />
    </p>
  );
}
