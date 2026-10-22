## What changes

<!-- Short summary and the plan phase it belongs to. -->

## How it was tested

<!-- Tests added or updated, and manual verification if relevant. -->

## Checklist

- [ ] `npm run verify` passes locally (lint, types, knip, duplicates, layers, tests with coverage and build).
- [ ] All new logic has its test; every fixed bug has a test that reproduces it.
- [ ] No dead, duplicated or commented-out code, stray `console.log` or `TODO` without an issue.
- [ ] No unnecessary client components (`"use client"` only where there is interaction).
- [ ] New LLM calls respect the token budget and record it.
- [ ] Small PR focused on a single goal.
