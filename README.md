# cancer-info-app

Informational site about cancer for the general public, rural communities included, based **only** on the scientific articles the team uploads. The site's content is in Spanish (its audience's language); the code is in English.

- **Reader Agent**: reads each PDF in parts and writes a faithful *memory* in plain Spanish.
- **Presenter Agent**: uses those memories to build each page from a catalog of generic interfaces ([Hashbrown](https://hashbrown.dev)). It underlines keywords that guide the reader to the next topic.
- **Prefetching**: while the person reads, the system prepares the next pages. Each page is cached and serves every visitor.

**Stack**: Next.js 16 · Hashbrown 0.7 · Groq (`gpt-oss`) · Postgres (Neon) · Vercel

## Local development

Requirements: Node 24 or newer and a Neon project (or any Postgres 18).

```bash
npm install
cp .env.example .env.local   # fill in the values (see the file's comments)
npm run migrate              # creates the tables in DATABASE_URL
npm run dev                  # http://localhost:3000
```

- `/` and `/topic/<topic>`: the public pages.
- `/upload`: the team's panel (asks for `ADMIN_PASSWORD`). PDFs are uploaded there, their reading is followed and the AI's daily usage is shown.

To avoid spending Groq quota while developing, use `LLM_PROVIDER=fake`: the answers are valid but meaningless.

## Quality

`npm run verify` runs the same as CI:

| Script | What it checks |
|---|---|
| `lint`, `typecheck` | ESLint without warnings and strict TypeScript |
| `knip` | Unused code, exports and dependencies |
| `duplicates` | Duplicated code (jscpd, 0 clones) |
| `dependencies` | Rules between layers (see the README of each `src/` folder) |
| `test:coverage` | Unit, component and integration tests (needs `TEST_DATABASE_URL`, a database wiped on every run) |
| `build` | Applies the migrations and builds |

Also: `npm run e2e` (Playwright on a mobile profile) and `npm run lighthouse` (Lighthouse on mobile with a slow network; CI runs it on the production build).

## Frequent changes

- **Changing the AI model**: `GROQ_READER_MODEL` and `GROQ_PRESENTER_MODEL`. It must be a model with structured output in strict mode; the contract test in `src/infrastructure/llm/strict-schema.test.ts` helps validate it.
- **Adding a component to the catalog**:
  1. Write its contract (name, description for the model and props) in `src/ui-contracts/contracts.ts` and add it to `catalog`.
  2. Write the React component in `src/ui/components/` and register it in `src/ui/kit.ts`.
  3. The tests check that the catalog stays generic, accessible and compatible with Groq's strict mode.
- **Tuning how much is prefetched**: `PREFETCH_PER_VISIT` and `PREFETCH_DAILY_MAX`.

## Deployment

Vercel deploys a preview for every PR and production when merging into `main`. Each environment uses its own Neon branch (`main`, `preview` and `desarrollo`), and the build applies the migrations to its database.
