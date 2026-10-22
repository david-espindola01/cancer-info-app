"use client";

import { useEffect, useState } from "react";
import { fetchStatus, type SystemStatus } from "./api-client";

const formatNumber = (value: number) => value.toLocaleString("es");

/**
 * How much the AI was used today (Groq's free tier has a daily limit) and how many pages
 * are ready. `version` changes when the list of articles changes.
 */
export function UsagePanel({ version }: { version: string }) {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    void fetchStatus().then(setStatus);
  }, [version]);

  if (!status) return null;
  const tokens = Object.entries(status.usageToday).filter(([reason]) => reason.startsWith("tokens:"));

  return (
    <section aria-label="Uso de hoy" className="mt-8 rounded-xl border border-border bg-surface p-4">
      <h2 className="text-xl font-bold">Uso de hoy</h2>
      <ul className="mt-2 flex flex-col gap-1">
        {tokens.map(([reason, amount]) => (
          <li key={reason}>
            {reason.slice("tokens:".length)}: {formatNumber(amount)} tokens
          </li>
        ))}
        {tokens.length === 0 && <li>Todavía no se usó la IA hoy.</li>}
        <li>Páginas preparadas por adelantado: {formatNumber(status.usageToday.prefetch ?? 0)}</li>
        <li>Páginas listas para servir: {formatNumber(status.readyPages)}</li>
      </ul>
    </section>
  );
}
