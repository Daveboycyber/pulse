# Friction Report – Building Pulse on Arkiv (Tiramisu)

## Environment

- Network: Tiramisu testnet, chain ID 7738577
- SDK: `@arkiv-network/sdk@0.8.1`
- viem: `2.57.7`
- App: Next.js 16.4.2 (Turbopack), Windows, Node.js v26.9.0
- RPC: `https://rpc.tiramisu.db-chain.testnet.arkiv.network` (default from `tiramisu` chain)
- Date: 2026-10-16

## 1. dotenv not installed by default

- Expected: `import "dotenv/config"` would work after the install docs.
- Actual: `Error: Cannot find module 'dotenv/config'` when running `npx tsx --env-file=.env.local scripts/seed-alerts.ts`.
- Fix: `npm install dotenv`.
- Note: `--env-file` already loads the file for `process.env`. The extra import is unnecessary if you only use `process.env`. We kept it and installed the package.

## 2. Private key format

- Expected: any string in `PRIVATE_KEY` would be rejected with a clear message.
- Actual: `invalid private key, expected hex or 32 bytes, got string` from `@noble/curves` if the value is not `0x` + 64 hex chars.
- Repro: put a wrong or quoted key in `.env.local`, run the seed script.
- Fix: one line, no quotes, no spaces: `PRIVATE_KEY=0x...`

## 3. Attribute shape on read is not a plain map

- Expected: `entity.attributes` would be an array of `{ name, value }` that is directly iterable, with primitive `value`s.
- Actual (SDK 0.8.1, `select({ attributes: true })`):
  - First error: `entity.attributes is not iterable` when treating it as an array in every case.
  - After handling both array and object shapes, rendering crashed with: `Objects are not valid as a React child (found: object with keys {type, value})`.
- Meaning: attribute values come back as typed wrappers `{ type, value }`, not raw strings/numbers.
- Repro: query `status = "active"` for entities created with `attributes: { type, severity: i32(n), status, region, title }` and render `attr.value` without unwrapping.
- Workaround used: if the value is an object with a `value` key, use that; coerce title/type/status/region with `String()` and severity with `Number()` before JSX.

## 4. Next.js 16 rejects `export const dynamic = "force-dynamic"`

- Expected: `export const dynamic = "force-dynamic"` would opt the page out of static prerender so the Arkiv query can run on each request.
- Actual: build error `Route segment config "dynamic" is not compatible with nextConfig.cacheComponents. Please remove it.` (Next.js 16.4.2).
- Then, after removing it: `Next.js encountered uncached data during prerendering` on `publicClient...fetch()`.
- Fix that worked: `export const instant = false;` at the top of `src/app/page.tsx` (the "Block" option suggested by the Next.js error overlay).

## 5. localStorage warning in Node

- Actual: `(node) ExperimentalWarning: localStorage is not available because --localstorage-file was not provided.` during both the seed script and the server render.
- Impact: warning only. Writes and queries still succeeded.
- SDK/runtime: Node.js v26.9.0 + `@arkiv-network/sdk@0.8.1`.

## What worked cleanly

- Faucet GLM on `0xF3c74846784d5f379f1366D4d78859db9f2E2819` was enough to create 6 entities in one script.
- `createEntity` with `expires: ExpirationTime.fromHours(n)`, `jsonToPayload(...)`, string attributes, and `i32(severity)` all succeeded on the first valid-key run.
- `publicClient.select(...).where(eq("status", "active")).limit(20).fetch()` returned the seeded alerts and the page renders them.

## Versions to pin in the write-up

- `@arkiv-network/sdk@0.8.1`
- `viem@2.57.7`
- `next@16.4.2`
- Node `v26.9.0`
