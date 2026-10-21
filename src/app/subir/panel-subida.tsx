"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DocumentoVista } from "../api/http";
import { pedirDocumentos } from "./cliente-api";
import { FormularioAcceso } from "./formulario-acceso";
import { leerDocumento } from "./leer-documento";
import { ListaDocumentos, type Actividad } from "./lista-documentos";
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
  const [actividad, setActividad] = useState<Actividad | null>(null);
  // Se lee un documento a la vez: el límite de la IA es por minuto.
  const leyendo = useRef(false);

  const cargar = useCallback(() => {
    void consultarEstado().then(setEstado);
  }, []);

  const leer = useCallback(
    (id: string) => {
      if (leyendo.current) return;
      leyendo.current = true;
      void leerDocumento(id, (mensaje) => setActividad({ id, mensaje })).finally(() => {
        leyendo.current = false;
        setActividad(null);
        cargar();
      });
    },
    [cargar],
  );

  useEffect(cargar, [cargar]);

  // Lee automáticamente, de a uno, los documentos que esperan lectura.
  const siguiente =
    estado.fase === "listo"
      ? estado.documentos.find((d) => d.estado === "pendiente" || d.estado === "procesando")?.id
      : undefined;
  useEffect(() => {
    if (siguiente) leer(siguiente);
  }, [siguiente, leer]);

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
          <ListaDocumentos documentos={estado.documentos} actividad={actividad} alReintentar={leer} />
        </>
      );
  }
}
