"use client";

import { useState, type FormEvent } from "react";
import { requestSession } from "./api-client";

export function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    const message = await requestSession(password);
    setSending(false);
    if (message) setError(message);
    else onLogin();
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
      <label htmlFor="password" className="font-semibold">
        Clave del equipo
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="rounded border border-current px-3 py-2"
      />
      <button
        type="submit"
        disabled={sending}
        className="self-start rounded bg-foreground px-4 py-2 font-semibold text-background disabled:opacity-60"
      >
        {sending ? "Entrando…" : "Entrar"}
      </button>
      {error && (
        <p role="alert" className="font-semibold">
          {error}
        </p>
      )}
    </form>
  );
}
