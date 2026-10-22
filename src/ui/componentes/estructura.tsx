import { useId, type ReactNode } from "react";
import { TextoConTemas } from "../texto-con-temas";

/** Sección con un rombo de color; en la página, cada sección toma el siguiente color de la paleta. */
export function Seccion({ titulo, children }: { titulo: string; children?: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="color-turquesa flex flex-col gap-4">
      <h2 id={id} className="flex items-center gap-3 text-2xl font-bold">
        <span aria-hidden className="size-4 shrink-0 rotate-45 rounded-sm bg-(--c)" />
        {titulo}
      </h2>
      <div className="flex flex-col gap-4 border-l-4 border-(--cf) pl-4">{children}</div>
    </section>
  );
}

/** Banda de bienvenida con formas decorativas. */
export function Encabezado({ titulo, subtitulo }: { titulo: string; subtitulo: string | null }) {
  return (
    <header className="color-turquesa relative overflow-hidden rounded-3xl bg-(--cf) px-5 py-7">
      <span aria-hidden className="absolute -right-10 -top-12 size-40 rounded-full bg-(--c) opacity-15" />
      <span aria-hidden className="absolute -bottom-10 right-20 size-24 rotate-12 rounded-[40%] bg-(--coral) opacity-20" />
      <span aria-hidden className="absolute bottom-6 right-6 size-6 rounded-full bg-(--violeta) opacity-30" />
      <h1 className="relative text-3xl font-bold leading-tight sm:text-4xl">{titulo}</h1>
      {subtitulo && <p className="relative mt-2 text-xl text-tenue">{subtitulo}</p>}
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
