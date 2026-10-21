import { notFound } from "next/navigation";
import { after, connection } from "next/server";
import { temas } from "@/infraestructura/contenedor";
import { PaginaGenerada } from "@/ui/pagina-generada";
import { EsperaTema } from "./espera-tema";

/**
 * Contenido de la página de un tema, resuelto en el servidor: si ya está en caché llega
 * con el HTML armado (se lee aunque el JavaScript tarde en cargar en una red lenta).
 */
export async function ContenidoTema({ slug }: { slug: string }) {
  // Siempre al momento de la petición: nunca se consulta la base ni la IA al compilar.
  await connection();
  const resultado = await temas.obtener(slug);

  switch (resultado.tipo) {
    case "no-valido":
      notFound();
    case "error":
      return (
        <p role="alert" className="font-semibold">
          No pudimos preparar esta página ahora. Intenta de nuevo en unos minutos.
        </p>
      );
    case "preparando":
      return <EsperaTema reintentarMs={resultado.reintentarMs} />;
    case "lista":
      // Se muestra la versión guardada y, después de responder, se prepara la nueva.
      if (resultado.desactualizada) after(() => temas.regenerar(resultado.pagina.slug));
      return <PaginaGenerada ui={resultado.pagina.ui} fuentes={resultado.pagina.fuentes} />;
  }
}
