import type { ReactNode } from "react";
import { estilos } from "../estilos";
import { IconoAlerta, IconoInformacion, IconoSalud } from "../iconos";
import { TextoConTemas } from "../texto-con-temas";

export function Cifra({ valor, descripcion, fuente }: { valor: string; descripcion: string; fuente: number }) {
  return (
    <figure className={`${estilos.tarjeta} flex flex-col gap-1`}>
      <p className="text-4xl font-bold text-acento">{valor}</p>
      <figcaption>
        {descripcion} <span className="text-base text-tenue">(fuente {fuente})</span>
      </figcaption>
    </figure>
  );
}

export function Definicion({ termino, explicacion }: { termino: string; explicacion: string }) {
  return (
    <dl className={estilos.tarjeta}>
      <dt className="text-base font-semibold uppercase tracking-wide text-tenue">¿Qué significa?</dt>
      <dd className="mt-1">
        <span className="font-bold">{termino}:</span> <TextoConTemas texto={explicacion} />
      </dd>
    </dl>
  );
}

export type TipoAviso = "informativo" | "importante" | "consulta";

const AVISOS: Record<TipoAviso, { etiqueta: string; icono: ReactNode; clases: string }> = {
  informativo: {
    etiqueta: "Dato útil",
    icono: <IconoInformacion />,
    clases: "border-aviso-informativo bg-aviso-informativo-fondo text-aviso-informativo",
  },
  importante: {
    etiqueta: "Importante",
    icono: <IconoAlerta />,
    clases: "border-aviso-importante bg-aviso-importante-fondo text-aviso-importante",
  },
  consulta: {
    etiqueta: "Consulta a un profesional de salud",
    icono: <IconoSalud />,
    clases: "border-aviso-consulta bg-aviso-consulta-fondo text-aviso-consulta",
  },
};

export function Aviso({ tipo, texto }: { tipo: TipoAviso; texto: string }) {
  const aviso = AVISOS[tipo];
  return (
    <aside className={`rounded-xl border-l-8 p-4 ${aviso.clases}`}>
      <p className="flex items-center gap-2 font-bold">
        {aviso.icono}
        {aviso.etiqueta}
      </p>
      <p className="mt-1 text-foreground">
        <TextoConTemas texto={texto} />
      </p>
    </aside>
  );
}
