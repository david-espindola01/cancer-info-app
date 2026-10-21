import { Suspense } from "react";
import { ContenidoTema } from "../../contenido-tema";
import { EsqueletoTema } from "../../esqueleto-tema";

/** El slug puede llegar codificado si alguien escribe la dirección con tildes. */
function decodificar(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export default function Tema({ params }: PageProps<"/tema/[slug]">) {
  return (
    <Suspense fallback={<EsqueletoTema />}>
      {params.then(({ slug }) => (
        <ContenidoTema slug={decodificar(slug)} />
      ))}
    </Suspense>
  );
}
