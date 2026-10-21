"use client";

import { createContext, use } from "react";
import type { FuentePagina } from "@/dominio/pagina";

const ContextoFuentes = createContext<FuentePagina[]>([]);

export const ProveedorFuentes = ContextoFuentes;

export const useFuentes = () => use(ContextoFuentes);
