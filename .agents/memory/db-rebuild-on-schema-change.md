---
name: DB package rebuild on schema change
description: lib/db uses TypeScript composite project references — api-server reads compiled declarations from lib/db/dist, not source. Must rebuild after any schema change.
---

## Rule

After any edit to `lib/db/src/schema/**`, run:

```
pnpm --filter @workspace/db exec tsc -p tsconfig.json
```

Then restart the API Server workflow.

**Why:** `lib/db`'s `tsconfig.json` has `"composite": true` + `"emitDeclarationOnly": true`. The `api-server`'s `tsconfig.json` lists `../../lib/db` as a `references` entry, so TypeScript resolves `@workspace/db` types from `lib/db/dist/*.d.ts` compiled declarations — not from live source. Skipping this step causes "Module has no exported member" and field mismatch errors in `api-server` even though the source is correct.

**How to apply:** Any time you add a new table/export to `lib/db/src/schema/index.ts` or change column definitions, always rebuild lib/db before running `api-server` typecheck.
