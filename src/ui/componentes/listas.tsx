import { estilos } from "../estilos";
import { IconoVisto } from "../iconos";
import { TextoConTemas } from "../texto-con-temas";

/** Puntos con viñetas de visto bueno, del color del contenedor. */
function Puntos({ puntos }: { puntos: string[] }) {
  return (
    <ul className={estilos.lista}>
      {puntos.map((punto, i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden className={`${estilos.circulo} mt-1 size-6`}>
            <IconoVisto />
          </span>
          <span>
            <TextoConTemas texto={punto} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ListaPuntos({ titulo, puntos }: { titulo: string | null; puntos: string[] }) {
  return (
    <div className="color-verde rounded-2xl bg-(--cf) p-4">
      {titulo && <h3 className={`${estilos.tituloBloque} text-(--c)`}>{titulo}</h3>}
      <Puntos puntos={puntos} />
    </div>
  );
}

/** Línea de tiempo: círculos numerados de colores unidos por una línea. */
export function Pasos({ titulo, pasos }: { titulo: string | null; pasos: { titulo: string; texto: string }[] }) {
  return (
    <div>
      {titulo && <h3 className={estilos.tituloBloque}>{titulo}</h3>}
      <ol className="ciclo-color mt-3 flex flex-col">
        {pasos.map((paso, i) => (
          <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
            {i < pasos.length - 1 && (
              <span aria-hidden className="absolute bottom-0 left-[1.125rem] top-10 w-1 rounded-full bg-borde" />
            )}
            <span aria-hidden className={`${estilos.circulo} relative size-10 text-lg`}>
              {i + 1}
            </span>
            <div className="pt-1.5">
              <p className="font-bold text-(--c)">{paso.titulo}</p>
              <p>
                <TextoConTemas texto={paso.texto} />
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Columnas con pestaña de color (por ejemplo, «Mito» y «Realidad»). */
export function Comparacion({
  titulo,
  columnas,
}: {
  titulo: string;
  columnas: { titulo: string; puntos: string[] }[];
}) {
  return (
    <div>
      <h3 className={estilos.tituloBloque}>{titulo}</h3>
      <div className="ciclo-color mt-3 grid gap-3 sm:grid-cols-2">
        {columnas.map((columna, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border-2 border-(--c)">
            <h4 className="bg-(--c) px-4 py-2 text-lg font-bold text-background">{columna.titulo}</h4>
            <div className="h-full bg-(--cf) px-4 pb-4 pt-2">
              <Puntos puntos={columna.puntos} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Preguntas como burbujas de diálogo que se despliegan al tocarlas. */
export function PreguntasRespuestas({ preguntas }: { preguntas: { pregunta: string; respuesta: string }[] }) {
  return (
    <div className="color-violeta flex flex-col gap-3">
      <h3 className={estilos.tituloBloque}>Preguntas frecuentes</h3>
      {preguntas.map((item, i) => (
        <details key={i} className="group">
          <summary className="elevable flex cursor-pointer list-none items-center gap-3 rounded-2xl rounded-bl-sm bg-(--cf) px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
            <span aria-hidden className={`${estilos.circulo} size-8`}>
              ?
            </span>
            <span className="flex-1">{item.pregunta}</span>
            <span aria-hidden className="text-2xl leading-none text-(--c) transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="ml-11 mt-2 rounded-2xl rounded-tl-sm border-2 border-(--cf) px-4 py-3">
            <TextoConTemas texto={item.respuesta} />
          </p>
        </details>
      ))}
    </div>
  );
}
