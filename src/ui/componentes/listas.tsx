import { estilos } from "../estilos";
import { TextoConTemas } from "../texto-con-temas";

function Puntos({ puntos }: { puntos: string[] }) {
  return (
    <ul className={estilos.lista}>
      {puntos.map((punto, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden className="mt-2.5 size-2 shrink-0 rounded-full bg-acento" />
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
    <div>
      {titulo && <h3 className={estilos.tituloBloque}>{titulo}</h3>}
      <Puntos puntos={puntos} />
    </div>
  );
}

export function Pasos({ titulo, pasos }: { titulo: string | null; pasos: { titulo: string; texto: string }[] }) {
  return (
    <div>
      {titulo && <h3 className={estilos.tituloBloque}>{titulo}</h3>}
      <ol className={estilos.lista}>
        {pasos.map((paso, i) => (
          <li key={i} className="flex gap-3">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-acento font-bold text-background"
            >
              {i + 1}
            </span>
            <div>
              <p className="font-semibold">{paso.titulo}</p>
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
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {columnas.map((columna, i) => (
          <div key={i} className={estilos.tarjeta}>
            <h4 className="text-lg font-bold">{columna.titulo}</h4>
            <Puntos puntos={columna.puntos} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PreguntasRespuestas({ preguntas }: { preguntas: { pregunta: string; respuesta: string }[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className={estilos.tituloBloque}>Preguntas frecuentes</h3>
      {preguntas.map((item, i) => (
        <details key={i} className={`${estilos.tarjeta} group`}>
          <summary className="cursor-pointer font-semibold">{item.pregunta}</summary>
          <p className="mt-2">
            <TextoConTemas texto={item.respuesta} />
          </p>
        </details>
      ))}
    </div>
  );
}
