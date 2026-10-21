"use client";

import { useState, type ChangeEvent } from "react";
import { enviarDocumento } from "./cliente-api";
import { extraerTextoPdf } from "./extraer-texto-pdf";

interface Progreso {
  nombre: string;
  mensaje: string;
}

export function SelectorPdf({ alSubir }: { alSubir: () => void }) {
  const [progreso, setProgreso] = useState<Progreso[]>([]);

  const anotar = (nombre: string, mensaje: string) =>
    setProgreso((actual) => actual.map((p) => (p.nombre === nombre ? { nombre, mensaje } : p)));

  async function procesar(evento: ChangeEvent<HTMLInputElement>) {
    const archivos = [...(evento.target.files ?? [])];
    evento.target.value = "";
    setProgreso(archivos.map((archivo) => ({ nombre: archivo.name, mensaje: "En cola…" })));

    for (const archivo of archivos) {
      try {
        anotar(archivo.name, "Leyendo el PDF…");
        const texto = await extraerTextoPdf(archivo);
        anotar(archivo.name, "Enviando…");
        const { mensaje } = await enviarDocumento(archivo.name.replace(/\.pdf$/i, ""), texto);
        anotar(archivo.name, mensaje);
      } catch {
        anotar(archivo.name, "No se pudo leer este archivo. ¿Es un PDF válido?");
      }
    }
    alSubir();
  }

  return (
    <div className="mt-6">
      <label htmlFor="pdfs" className="font-semibold">
        Elegir artículos (PDF)
      </label>
      <input
        id="pdfs"
        type="file"
        accept="application/pdf"
        multiple
        onChange={procesar}
        className="mt-2 block"
      />
      {progreso.length > 0 && (
        <ul aria-live="polite" className="mt-3 flex flex-col gap-1">
          {progreso.map(({ nombre, mensaje }) => (
            <li key={nombre}>
              <span className="font-semibold">{nombre}:</span> {mensaje}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
