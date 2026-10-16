# Pulse

Public incident and status feed that no single operator can edit, hide, or take down.

**Live:** https://pulse-nu-rust.vercel.app  
**Track:** Censorship Resistance  
**Network:** Arkiv Tiramisu (chain ID 7738577)

Anyone with a wallet can publish an alert. Anyone can read the feed. Each alert is owned by the wallet that posted it and expires on its own, so the feed stays current without a moderator.

## Why Arkiv

A status page on a normal server dies when the host, the registrar, or the company decides it should. Pulse stores the feed as Arkiv entities:

- **Queryable attributes** (`app`, `type`, `severity`, `status`, `region`, `title`) so the page can filter without downloading everything.
- **JSON payload** for the free-text description.
- **`$creator`** so authorship is the wallet, not an account we control.
- **Native expiration** (`ExpirationTime.fromHours`) so old incidents leave the feed. That is the product, not cleanup.

There is no app database and no admin key in the deployed site. The Next.js app only reads. Writes are signed in the browser by the user's wallet.

## Try it

1. Open https://pulse-nu-rust.vercel.app
2. Connect MetaMask. The app adds the Tiramisu network (chain ID `7738577`, RPC `https://rpc.tiramisu.db-chain.testnet.arkiv.network`).
3. Get test GLM from https://hub.arkiv.network/faucet
4. Post an alert. It shows up on the public feed, tagged with your address, and disappears when the chosen lifetime ends.

Seed data was written by `0xF3c74846784d5f379f1366D4d78859db9f2E2819`.

## Schema

See [arkiv/schema.md](arkiv/schema.md). Every Pulse entity has `app = "pulse"` so the query does not pick up other apps on the shared testnet.

```ts
attributes: {
  app: "pulse",
  type,                          // incident | outage | status | safety
  severity: i32(1..5),
  status,                        // active | monitoring | resolved
  region,
  title,
}
payload: { description, source }
expires: ExpirationTime.fromHours(12 | 24 | 48 | 72)
```

Read path:

```ts
publicClient.select({ key: true, attributes: true, payload: true, creator: true })
  .where(eq("app", "pulse"))
  .limit(20)
  .fetch()
```

## Repo layout

| Path | What |
| --- | --- |
| `src/app/page.tsx` | Server-rendered feed |
| `src/app/post-alert.tsx` | Browser wallet write form |
| `src/lib/arkiv.ts` | Public client |
| `scripts/seed-alerts.ts` | One-shot seed (needs `PRIVATE_KEY` in `.env.local`, never committed) |
| `arkiv/schema.md` | Entity model |
| `arkiv/friction.md` | What broke while building on SDK 0.8.1 |

## Local

```bash
npm install
npm run dev
```

Optional seed:

```bash
# .env.local
PRIVATE_KEY=0x...
npx tsx --env-file=.env.local scripts/seed-alerts.ts
```

## Stack

- Next.js 16, `@arkiv-network/sdk@0.8.1`, `viem@2.57.7`
- License: MIT
