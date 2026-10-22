"use client";

import { createContext, use } from "react";
import type { PageSource } from "@/domain/page";

const SourcesContext = createContext<PageSource[]>([]);

export const SourcesProvider = SourcesContext;

export const useSources = () => use(SourcesContext);
