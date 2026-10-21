"use client";

import Link from "next/link";
import { normalizarSlug } from "@/dominio/slug";
import { estilos } from "../estilos";
import { useFuentes } from "../fuentes";
import { IconoFlecha } from "../iconos";

export function Fuentes({ numeros }: { numeros: number[] }) {
  const usadas = useFuentes().filter((fuente) => numeros.includes(fuente.numero));
  if (usadas.length === 0) return null;
  return (
    <section aria-label="Fuentes" className="border-t border-borde pt-4 text-base text-tenue">
      <h2 className="font-bold">Fuentes</h2>
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

export function SiguientesTemas({ temas }: { temas: { etiqueta: string; porQue: string }[] }) {
  return (
    <nav aria-label="Sigue aprendiendo" className="flex flex-col gap-3">
      <h2 className="text-2xl font-bold">Sigue aprendiendo</h2>
      <ul className="flex flex-col gap-3">
        {temas.map((tema) => (
          <li key={tema.etiqueta}>
            <Link
              href={`/tema/${normalizarSlug(tema.etiqueta)}`}
              className={`${estilos.tarjeta} flex items-center gap-3 hover:border-acento`}
            >
              <span className="flex-1">
                <span className="block font-bold text-acento first-letter:uppercase">{tema.etiqueta}</span>
                <span className="block text-base">{tema.porQue}</span>
              </span>
              <IconoFlecha />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SinInformacion({ mensaje }: { mensaje: string }) {
  return (
    <div className={`${estilos.tarjeta} flex flex-col gap-3`}>
      <p>{mensaje}</p>
      <Link href="/" className="tema-subrayado self-start">
        Volver al inicio
      </Link>
    </div>
  );
}
