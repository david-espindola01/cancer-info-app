"use client";

/** Si algo falla al mostrar un tema, se explica con calma y se ofrece reintentar. */
export default function ErrorTema({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Algo salió mal al mostrar esta página</h1>
      <p>No es tu culpa. Puede ser la conexión o un problema momentáneo de nuestra parte.</p>
      <button
        type="button"
        onClick={reset}
        className="self-start rounded-lg bg-acento px-4 py-2 font-semibold text-background"
      >
        Reintentar
      </button>
    </div>
  );
}
