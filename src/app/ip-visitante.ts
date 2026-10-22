/** IP del visitante según el proxy de Vercel (la primera de `x-forwarded-for`). */
export function ipVisitante(encabezados: Headers): string {
  return (
    encabezados.get("x-forwarded-for")?.split(",")[0]?.trim() || encabezados.get("x-real-ip") || "desconocida"
  );
}
