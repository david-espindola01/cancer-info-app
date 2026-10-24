"use client";

/** If something fails while showing a topic, it is explained calmly and a retry is offered. */
export default function TopicError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Algo salió mal al mostrar esta página</h1>
      <p>No es tu culpa. Puede ser la conexión o un problema momentáneo de nuestra parte.</p>
      <button
        type="button"
        onClick={reset}
        className="color-barro solid self-start rounded-full px-5 py-2 font-extrabold"
      >
        Reintentar
      </button>
    </div>
  );
}
