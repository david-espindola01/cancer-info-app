"use client";

import Link from "next/link";
import { normalizarSlug } from "@/dominio/slug";
import { estilos } from "../estilos";
import { useFuentes } from "../fuentes";
import { IconoBusqueda, IconoFlecha, IconoLibro } from "../iconos";

export function Fuentes({ numeros }: { numeros: number[] }) {
  const usadas = useFuentes().filter((fuente) => numeros.includes(fuente.numero));
  if (usadas.length === 0) return null;
  return (
    <section aria-label="Fuentes" className="border-t border-borde pt-4 text-base text-tenue">
      <h2 className="flex items-center gap-2 font-bold">
        <IconoLibro />
        Fuentes
      </h2>
      <ol className="mt-1 flex flex-col gap-1">
        {usadas.map((fuente) => (
          <li key={fuente.numero}>
            [{fuente.numero}] {fuente.titulo}. {fuente.referencia}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Tarjetas de colores hacia los temas recomendados; al tocarlas, la página avanza deslizándose. */
export function SiguientesTemas({ temas }: { temas: { etiqueta: string; porQue: string }[] }) {
  return (
    <nav aria-label="Sigue aprendiendo" className="flex flex-col gap-3">
      <h2 className="text-2xl font-bold">Sigue aprendiendo</h2>
      <ul className="ciclo-color grid gap-3 sm:grid-cols-2">
        {temas.map((tema) => (
          <li key={tema.etiqueta}>
            <Link
              href={`/tema/${normalizarSlug(tema.etiqueta)}`}
              transitionTypes={["avanzar"]}
              className="elevable flex h-full items-center gap-3 rounded-2xl border-2 border-transparent bg-(--cf) p-4 hover:border-(--c)"
            >
              <span className="flex-1">
                <span className="block font-bold text-(--c) first-letter:uppercase">{tema.etiqueta}</span>
                <span className="block text-base">{tema.porQue}</span>
              </span>
              <span aria-hidden className={`${estilos.circulo} size-9`}>
                <IconoFlecha />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SinInformacion({ mensaje }: { mensaje: string }) {
  return (
    <div className="color-ambar flex flex-col gap-3 rounded-3xl bg-(--cf) p-5">
      <span aria-hidden className={`${estilos.circulo} size-12`}>
        <IconoBusqueda />
      </span>
      <p>{mensaje}</p>
      <Link href="/" transitionTypes={["volver"]} className="tema-subrayado self-start">
        Volver al inicio
      </Link>
    </div>
  );
}
