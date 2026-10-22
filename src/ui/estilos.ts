/** Clases compartidas por los componentes del catálogo (una sola definición de cada estilo). */
export const estilos = {
  tituloBloque: "text-xl font-bold",
  lista: "mt-2 flex flex-col gap-2",
  /** Círculo de color con contenido claro (números, íconos). */
  circulo: "flex shrink-0 items-center justify-center rounded-full bg-(--c) font-bold text-background",
} as const;
