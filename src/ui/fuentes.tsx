"use client";

import { createContext, use } from "react";

/** Una fuente que respalda la página; el modelo solo la cita por su número. */
export interface FuenteVista {
  numero: number;
  titulo: string;
  referencia: string;
}

const ContextoFuentes = createContext<FuenteVista[]>([]);

export const ProveedorFuentes = ContextoFuentes;

export const useFuentes = () => use(ContextoFuentes);
