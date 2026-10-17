# Pulse

A public incident record that no single operator can rewrite or take down.

**Live:** https://pulse-nu-rust.vercel.app  
**Track:** Censorship Resistance  
**Network:** Arkiv Tiramisu (chain ID 7738577)

An alert is one Arkiv entity. A correction is a second entity that points at the first. The original text stays. Both expire on their own. The website has no admin key.

## Why this is not a normal status page

A company status page dies when the host, the registrar, or the company decides it should. Pulse stores the feed as wallet-owned Arkiv entities:

| Property | How |
|----------|-----|
| Authorship | `$creator` is the signing wallet |
| History | `kind=update` entities with `parent=<alert key>` — no patch of the original |
| Scope | `app=pulse` so the shared testnet does not pollute the feed |
| Lifetime | `ExpirationTime.fromHours` is a product rule, not cleanup |
| Operator power | Deployed site only uses a public client. It cannot delete third-party records |

Judges can open any card, click the creator address or transaction link, and verify the record on [Tiramisu explorer](https://tiramisu.explorer.arkiv.network).

## Try it

1. Open https://pulse-nu-rust.vercel.app
2. Connect MetaMask (the app adds Tiramisu: chain `7738577`, RPC `https://rpc.tiramisu.db-chain.testnet.arkiv.network`)
3. Get test GLM from https://hub.arkiv.network/faucet
4. Publish an alert
5. On that card, open **Add an update** and publish a note (monitoring / resolved / worsened)
6. Confirm the original text is still there and the note appears under it with its own explorer link

Seed wallet: `0xF3c74846784d5f379f1366D4d78859db9f2E2819`.

## Schema

Full model: [arkiv/schema.md](arkiv/schema.md).

```ts
// First record
attributes: {
  app: "pulse",
  kind: "alert",
  type, severity: i32(1..5), status, region, title,
}

// Later note (does not mutate the alert)
attributes: {
  app: "pulse",
  kind: "update",
  parent: alertEntityKey,
  status, // monitoring | resolved | worsened
  title,
}
```

Read path:

```ts
publicClient
  .select({ key: true, attributes: true, payload: true, creator: true, createdAt: true })
  .where(eq("app", "pulse"))
  .limit(40)
  .fetch()
```

## Repo layout

| Path | What |
|------|------|
| `src/app/page.tsx` | Server feed: groups alerts and updates |
| `src/app/alert-card.tsx` | Card + explorer links + append-only update form |
| `src/app/post-alert.tsx` | Open a new alert from a browser wallet |
| `src/lib/arkiv.ts` | Public client |
| `src/lib/browser-wallet.ts` | MetaMask + Tiramisu + optional tx attribute patch |
| `scripts/seed-alerts.ts` | One-shot seed (`PRIVATE_KEY` in `.env.local`, never committed) |
| `arkiv/schema.md` | Entity model for judges |
| `arkiv/friction.md` | Build friction on SDK 0.8.1 |

## Local

```bash
npm install
npm run dev
```

```bash
# .env.local
PRIVATE_KEY=0x...
npx tsx --env-file=.env.local scripts/seed-alerts.ts
```

## Stack

- Next.js 16, `@arkiv-network/sdk@0.8.1`, `viem@2.57.7`
- License: MIT
