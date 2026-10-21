"use client";

import { useState, type FormEvent } from "react";
import { pedirSesion } from "./cliente-api";

export function FormularioAcceso({ alEntrar }: { alEntrar: () => void }) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    const mensaje = await pedirSesion(clave);
    setEnviando(false);
    if (mensaje) setError(mensaje);
    else alEntrar();
  }

  return (
    <form onSubmit={enviar} className="mt-6 flex flex-col gap-3">
      <label htmlFor="clave" className="font-semibold">
        Clave del equipo
      </label>
      <input
        id="clave"
        type="password"
        autoComplete="current-password"
        required
        value={clave}
        onChange={(evento) => setClave(evento.target.value)}
        className="rounded border border-current px-3 py-2"
      />
      <button
        type="submit"
        disabled={enviando}
        className="self-start rounded bg-foreground px-4 py-2 font-semibold text-background disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
      {error && (
        <p role="alert" className="font-semibold">
          {error}
        </p>
      )}
    </form>
  );
}
