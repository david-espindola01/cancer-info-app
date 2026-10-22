import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-12">
      <h1 className="text-3xl font-bold">No encontramos esta página</h1>
      <p>Puede que la dirección esté mal escrita. Desde el inicio puedes llegar a todos los temas.</p>
      <Link href="/" className="topic-link self-start">
        Ir al inicio
      </Link>
    </main>
  );
}
