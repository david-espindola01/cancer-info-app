# ui-contracts

Definitions of the generic components (name, description and props with Hashbrown's `s` schema), without React. Only the server uses them: to build the schema the Presenter Agent follows and to check each component's props before rendering it (`ui/kit.ts`). They never reach the browser.

- May import: `domain/` and `@hashbrownai/core`.
- May not import: React, `ui/` or the server.
- No contract may refer to a specific topic: they are generic.
