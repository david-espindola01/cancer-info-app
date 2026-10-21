# aplicacion

Casos de uso: registrar un documento, procesar el siguiente paso de lectura, obtener la página de un tema, precargar temas.

- Puede importar: `dominio/`, los puertos (interfaces) definidos en esta misma capa y Skillet (`@hashbrownai/core`) para los contratos de salida de los agentes.
- No puede importar: implementaciones concretas (`infraestructura/`), Next.js ni React.
- Recibe sus dependencias por parámetro (inversión de dependencias).
