import Link from "next/link";
import { Fragment } from "react";
import { segmentarMarcas } from "@/dominio/marcas";

/** Muestra un texto con sus palabras clave [[marcadas]] como enlaces subrayados a su tema. */
export function TextoConTemas({ texto }: { texto: string }) {
  return (
    <>
      {segmentarMarcas(texto).map((segmento, i) =>
        segmento.tipo === "tema" ? (
          <Link key={i} href={`/tema/${segmento.slug}`} className="tema-subrayado">
            {segmento.texto}
          </Link>
        ) : (
          <Fragment key={i}>{segmento.texto}</Fragment>
        ),
      )}
    </>
  );
}
