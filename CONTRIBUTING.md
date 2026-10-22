# Contributing

Thanks for helping! This guide gets you from zero to an open pull request.

## Ground rules

- **The site only shows what the uploaded articles say.** Do not add health information of your own to prompts, components or tests that end up on a page. If something is missing, the fix is a better article, not new text.
- **The code is in English; the site's visible text is in Spanish** (its audience's language).
- **Never commit secrets.** Keys and passwords live in `.env.local` (ignored by Git) and in Vercel.
- One pull request, one goal. Small PRs get reviewed and merged faster.

## Set up

Requirements: Node 24 or newer (see `.nvmrc`) and a Postgres 18 database. Docker is the quickest way to get one:

```bash
docker run --name cancer-info-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:18
docker exec cancer-info-db createdb -U postgres dev
docker exec cancer-info-db createdb -U postgres tests
```

Then:

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```bash
LLM_PROVIDER=fake                     # valid answers without calling any AI (no key needed)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dev
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/tests   # wiped on every test run
ADMIN_PASSWORD=any-password-you-like  # to enter /upload
SESSION_SECRET=at-least-32-random-characters-here
```

```bash
npm run migrate   # creates the tables
npm run dev       # http://localhost:3000
```

With `LLM_PROVIDER=fake` everything works but the texts are meaningless. To see real pages, create a free key at [console.groq.com](https://console.groq.com/keys), set `LLM_PROVIDER=groq` and `GROQ_API_KEY`, and upload a PDF article in `/upload`.

## Make a change

1. Fork the repository (or create a branch if you are a collaborator) and branch off `main`: `feat/…`, `fix/…` or `docs/…`.
2. Write the change with its tests. Every new piece of logic has a test; every bug fixed has a test that reproduces it.
3. Run `npm run verify` (lint, types, dead code, duplicates, layer rules, tests with coverage and build). Optionally `npm run e2e`.
4. Open a pull request against `main` and fill in the template. CI runs the same checks; a maintainer reviews and merges.

## Where things live

`src/` is split in layers, and `npm run dependencies` enforces which may import which. Each folder's README explains its rules.

| Folder | What it holds |
|---|---|
| `domain/` | Pure rules: text, slugs, keyword marks |
| `application/` | Use cases (reading articles, building pages, the AI's line) and the ports they need |
| `ui-contracts/` | The catalog of generic components the Presenter Agent can use |
| `ui/` | The React components that draw that catalog |
| `infrastructure/` | Postgres, Groq and the composition root (`container.ts`) |
| `app/` | Next.js pages and API routes |

Common tasks (adding a catalog component, changing a model) are described in the [README](README.md#frequent-changes).

## Reporting problems

Open an issue with what you did, what you expected and what happened. A screenshot or the page's address helps a lot.
