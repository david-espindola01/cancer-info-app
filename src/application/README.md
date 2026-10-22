# application

Use cases: register a document, process the next reading step, get a topic's page, prefetch topics.

- May import: `domain/`, the ports (interfaces) defined in this layer, Skillet (`@hashbrownai/core`) and the `ui-contracts/` catalog, to define what the agents must answer.
- May not import: concrete implementations (`infrastructure/`), Next.js or React.
- Receives its dependencies as parameters (dependency inversion).
