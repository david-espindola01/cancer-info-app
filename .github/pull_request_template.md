## Qué cambia

<!-- Resumen breve y fase del plan a la que pertenece. -->

## Cómo se probó

<!-- Pruebas agregadas o actualizadas, y verificación manual si aplica. -->

## Checklist

- [ ] `npm run verificar` pasa en local (lint, tipos, knip, duplicados, capas, pruebas con cobertura y build).
- [ ] Toda lógica nueva tiene su prueba; todo bug corregido tiene una prueba que lo reproduce.
- [ ] Sin código muerto, duplicado, comentado, `console.log` sueltos ni `TODO` sin issue asociado.
- [ ] Sin componentes de cliente innecesarios (`"use client"` solo donde hay interacción).
- [ ] Las llamadas nuevas al LLM respetan el presupuesto de tokens y lo registran.
- [ ] PR pequeño y enfocado en un solo objetivo.
