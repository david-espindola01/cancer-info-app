# ui-contratos

Definiciones de los componentes genéricos (nombre, descripción y props con el esquema `s` de Hashbrown), sin React. Las usan el servidor (para generar el esquema que sigue el Agente Presentador) y el cliente (para `exposeComponent`).

- Puede importar: `dominio/` y `@hashbrownai/core`.
- No puede importar: React, `ui/` ni el servidor.
- Ningún contrato puede referirse a un tema concreto: son genéricos.
