"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { normalizarSlug } from "@/dominio/slug";

/** Permite preguntar por cualquier tema: la pregunta se convierte en la página de ese tema. */
export function PreguntaLibre() {
  const router = useRouter();
  const [pregunta, setPregunta] = useState("");

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const slug = normalizarSlug(pregunta);
    if (slug) router.push(`/tema/${slug}`);
  }

  return (
    <form role="search" onSubmit={enviar} className="flex flex-col gap-2 rounded-xl border border-borde bg-superficie p-4">
      <label htmlFor="pregunta" className="font-bold">
        ¿Qué más quieres saber?
      </label>
      <div className="flex gap-2">
        <input
          id="pregunta"
          type="search"
          value={pregunta}
          onChange={(evento) => setPregunta(evento.target.value)}
          placeholder="Por ejemplo: cómo se previene"
          className="min-w-0 flex-1 rounded-lg border border-borde bg-background px-3 py-2"
        />
        <button type="submit" className="rounded-lg bg-acento px-4 py-2 font-semibold text-background">
          Buscar
        </button>
      </div>
    </form>
  );
}
