"use client";

import { useEffect, useState } from "react";
import { pedirEstado, type EstadoSistema } from "./cliente-api";

const numero = (valor: number) => valor.toLocaleString("es");

/**
 * Cuánto se usó hoy la IA (la capa gratuita de Groq tiene límite diario) y cuántas
 * páginas hay listas. `version` cambia cuando cambia la lista de artículos.
 */
export function PanelUso({ version }: { version: string }) {
  const [estado, setEstado] = useState<EstadoSistema | null>(null);

  useEffect(() => {
    void pedirEstado().then(setEstado);
  }, [version]);

  if (!estado) return null;
  const tokens = Object.entries(estado.usoHoy).filter(([motivo]) => motivo.startsWith("tokens:"));

  return (
    <section aria-label="Uso de hoy" className="mt-8 rounded-xl border border-borde bg-superficie p-4">
      <h2 className="text-xl font-bold">Uso de hoy</h2>
      <ul className="mt-2 flex flex-col gap-1">
        {tokens.map(([motivo, cantidad]) => (
          <li key={motivo}>
            {motivo.slice("tokens:".length)}: {numero(cantidad)} tokens
          </li>
        ))}
        {tokens.length === 0 && <li>Todavía no se usó la IA hoy.</li>}
        <li>Páginas preparadas por adelantado: {numero(estado.usoHoy.precarga ?? 0)}</li>
        <li>Páginas listas para servir: {numero(estado.paginasListas)}</li>
      </ul>
    </section>
  );
}
