import type { ReactNode } from "react";
import { estilos } from "../estilos";
import { IconoAlerta, IconoInformacion, IconoLibro, IconoSalud } from "../iconos";
import { TextoConTemas } from "../texto-con-temas";

/** El dato dentro de un círculo grande, con su explicación al lado. */
export function Cifra({ valor, descripcion, fuente }: { valor: string; descripcion: string; fuente: number }) {
  return (
    <figure className="color-coral flex items-center gap-4 rounded-3xl bg-(--cf) p-4">
      <p className={`${estilos.circulo} min-h-24 min-w-24 max-w-[50%] px-4 py-3 text-center text-2xl leading-tight`}>
        {valor}
      </p>
      <figcaption>
        {descripcion} <span className="text-base text-tenue">(fuente {fuente})</span>
      </figcaption>
    </figure>
  );
}

/** Una nota con la esquina doblada, como la de un diccionario. */
export function Definicion({ termino, explicacion }: { termino: string; explicacion: string }) {
  return (
    <dl className="color-azul relative overflow-hidden rounded-2xl rounded-tr-none bg-(--cf) p-4 pr-10">
      <span aria-hidden className="absolute right-0 top-0 size-7 rounded-bl-2xl bg-(--c) opacity-40" />
      <dt className="flex items-center gap-2 text-base font-bold uppercase tracking-wide text-(--c)">
        <IconoLibro />
        ¿Qué significa?
      </dt>
      <dd className="mt-1">
        <span className="font-bold">{termino}:</span> <TextoConTemas texto={explicacion} />
      </dd>
    </dl>
  );
}

export type TipoAviso = "informativo" | "importante" | "consulta";

const AVISOS: Record<TipoAviso, { etiqueta: string; icono: ReactNode; color: string }> = {
  informativo: { etiqueta: "Dato útil", icono: <IconoInformacion />, color: "color-azul" },
  importante: { etiqueta: "Importante", icono: <IconoAlerta />, color: "color-ambar" },
  consulta: { etiqueta: "Consulta a un profesional de salud", icono: <IconoSalud />, color: "color-violeta" },
};

export function Aviso({ tipo, texto }: { tipo: TipoAviso; texto: string }) {
  const aviso = AVISOS[tipo];
  return (
    <aside className={`${aviso.color} flex gap-3 rounded-2xl border-2 border-(--c) bg-(--cf) p-4`}>
      <span aria-hidden className={`${estilos.circulo} size-11`}>
        {aviso.icono}
      </span>
      <div>
        <p className="font-bold text-(--c)">{aviso.etiqueta}</p>
        <p className="mt-1">
          <TextoConTemas texto={texto} />
        </p>
      </div>
    </aside>
  );
}
