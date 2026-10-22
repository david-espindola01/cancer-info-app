# cancer-info-app

Página informativa sobre cáncer para el público general, incluida la población rural, basada **solo** en los artículos científicos que sube el equipo.

- **Agente Lector**: lee cada PDF por partes y escribe una *memoria* fiel y en español sencillo.
- **Agente Presentador**: usa esas memorias para armar cada página con un catálogo de interfaces genéricas ([Hashbrown](https://hashbrown.dev)). Subraya palabras clave que guían al lector hacia el siguiente tema.
- **Precarga**: mientras la persona lee, el sistema prepara las páginas siguientes. Cada página queda en caché y sirve a todos los visitantes.

**Stack**: Next.js 16 · Hashbrown 0.7 · Groq (`gpt-oss`) · Postgres (Neon) · Vercel

## Desarrollo local

Requisitos: Node 24 o más reciente y un proyecto de Neon (o cualquier Postgres 18).

```bash
npm install
cp .env.example .env.local   # completa los valores (ver comentarios del archivo)
npm run migrar               # crea las tablas en DATABASE_URL
npm run dev                  # http://localhost:3000
```

- `/` y `/tema/<tema>`: las páginas públicas.
- `/subir`: el panel del equipo (pide `ADMIN_CLAVE`). Ahí se suben los PDF, se sigue su lectura y se ve el uso diario de la IA.

Para no gastar cuota de Groq mientras desarrollas, usa `LLM_PROVEEDOR=falso`: las respuestas serán válidas pero sin sentido.

## Calidad

`npm run verificar` corre lo mismo que CI:

| Script | Qué revisa |
|---|---|
| `lint`, `typecheck` | ESLint sin advertencias y TypeScript estricto |
| `knip` | Código, exports y dependencias sin usar |
| `duplicados` | Código duplicado (jscpd, 0 clones) |
| `dependencias` | Reglas entre capas (ver el README de cada carpeta de `src/`) |
| `test:cobertura` | Pruebas unitarias, de componentes y de integración (necesita `DATABASE_URL_PRUEBAS`, una base que se borra en cada corrida) |
| `build` | Aplica las migraciones y compila |

Además: `npm run e2e` (Playwright en perfil móvil) y `npm run lighthouse` (Lighthouse en móvil con red lenta; CI lo corre sobre el build de producción).

## Cómo hacer cambios frecuentes

- **Cambiar de modelo de IA**: `GROQ_MODELO_LECTOR` y `GROQ_MODELO_PRESENTADOR`. Tiene que ser un modelo con salida estructurada en modo estricto; la prueba de contrato de `src/infraestructura/llm/esquema-estricto.test.ts` ayuda a validarlo.
- **Agregar un componente al catálogo**:
  1. Escribe su contrato (nombre, descripción para el modelo y props) en `src/ui-contratos/contratos.ts` y súmalo a `catalogo`.
  2. Escribe el componente React en `src/ui/componentes/` y regístralo en `src/ui/kit.ts`.
  3. Las pruebas verifican que el catálogo siga siendo genérico, accesible y compatible con el modo estricto de Groq.
- **Ajustar cuánto se precarga**: `PRECARGA_POR_VISITA` y `PRECARGA_MAX_DIARIA`.

## Despliegue

Vercel despliega una vista previa por cada PR y la producción al fusionar en `main`. Cada entorno usa su propia rama de Neon (`main`, `preview` y `desarrollo`), y el build aplica las migraciones en la base que le corresponde.
