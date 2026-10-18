# Build notes — Arkiv SDK on Tiramisu

Notes from integrating `@arkiv-network/sdk` 0.8.1 with a Next.js 16 app.

## Environment

| Item | Value |
|------|--------|
| Network | Tiramisu testnet, chain ID `7738577` |
| SDK | `@arkiv-network/sdk@0.8.1` |
| viem | `2.57.7` |
| App | Next.js 16.4.2, Node.js v26.9.0 |
| RPC | `https://rpc.tiramisu.db-chain.testnet.arkiv.network` |

## Issues and workarounds

### 1. `dotenv` not installed by default

`import "dotenv/config"` failed with `Cannot find module 'dotenv/config'` when running the seed script. Install `dotenv`, or rely on `tsx --env-file=.env.local` alone.

### 2. Private key format

Keys that are not `0x` + 64 hex chars fail inside `@noble/curves` with `invalid private key, expected hex or 32 bytes, got string`. Use a single unquoted line: `PRIVATE_KEY=0x...`.

### 3. Attribute shape on read

`select({ attributes: true })` does not return a plain string map. Values arrive as typed wrappers `{ type, value }` (and the collection may be object- or array-shaped). Unwrap with a small helper before rendering in React.

### 4. Next.js 16 and `dynamic`

`export const dynamic = "force-dynamic"` conflicts with `cacheComponents` (`Route segment config "dynamic" is not compatible...`). After removing it, uncached Arkiv fetches during prerender need `export const instant = false` on the page.

### 5. `patchEntity` parameter name

Attribute updates use `set`, not `attributes`:

```ts
await walletClient.patchEntity({
  entityKey,
  set: { tx: txHash },
})
```

### 6. `localStorage` warning under Node

Node 26 may log `localStorage is not available because --localstorage-file was not provided` during seed and SSR. Warning only; queries and writes still succeed.

## What worked cleanly

- Faucet GLM was enough to create alerts and update entities in one script.
- `createEntity` with `ExpirationTime.fromHours`, `jsonToPayload`, string attributes, and `i32(severity)`.
- Browser `createWalletClient` with `custom(window.ethereum)` and the `tiramisu` chain object.
- Public `select().where(eq("app", "pulse")).fetch()` for the feed and API route.
