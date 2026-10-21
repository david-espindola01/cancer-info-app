"use client";

import { useCallback, useEffect, useState } from "react";
import type { DocumentoVista } from "../api/http";
import { pedirDocumentos } from "./cliente-api";
import { FormularioAcceso } from "./formulario-acceso";
import { ListaDocumentos } from "./lista-documentos";
import { SelectorPdf } from "./selector-pdf";

type Estado =
  | { fase: "cargando" }
  | { fase: "acceso" }
  | { fase: "listo"; documentos: DocumentoVista[] }
  | { fase: "error"; mensaje: string };

function consultarEstado(): Promise<Estado> {
  return pedirDocumentos().then(
    (documentos): Estado => (documentos ? { fase: "listo", documentos } : { fase: "acceso" }),
    (error: Error): Estado => ({ fase: "error", mensaje: error.message }),
  );
}

export function PanelSubida() {
  const [estado, setEstado] = useState<Estado>({ fase: "cargando" });

  const cargar = useCallback(() => {
    void consultarEstado().then(setEstado);
  }, []);

  useEffect(cargar, [cargar]);

  switch (estado.fase) {
    case "cargando":
      return <p className="mt-6">Cargando…</p>;
    case "acceso":
      return <FormularioAcceso alEntrar={cargar} />;
    case "error":
      return (
        <p role="alert" className="mt-6 font-semibold">
          {estado.mensaje}
        </p>
      );
    case "listo":
      return (
        <>
          <SelectorPdf alSubir={cargar} />
          <h2 className="mt-8 text-xl font-bold">Artículos</h2>
          <ListaDocumentos documentos={estado.documentos} />
        </>
      );
  }
}
