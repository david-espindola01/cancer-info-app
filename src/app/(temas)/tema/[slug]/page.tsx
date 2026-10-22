import { ContenidoTema } from "../../contenido-tema";
import { TransicionPagina } from "../../transicion-pagina";

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
    <TransicionPagina>
      {params.then(({ slug }) => (
        <ContenidoTema slug={decodificar(slug)} />
      ))}
    </TransicionPagina>
  );
}
