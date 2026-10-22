# aplicacion

Casos de uso: registrar un documento, procesar el siguiente paso de lectura, obtener la página de un tema, precargar temas.

- Puede importar: `dominio/`, los puertos (interfaces) definidos en esta misma capa, Skillet (`@hashbrownai/core`) y el catálogo de `ui-contratos/` para definir lo que deben responder los agentes.
- No puede importar: implementaciones concretas (`infraestructura/`), Next.js ni React.
- Recibe sus dependencias por parámetro (inversión de dependencias).
