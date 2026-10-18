# Pulse

Public incident feed on [Arkiv](https://arkiv.network). Many wallets can write. Updates never overwrite the original. The website has no operator key.

**Live app:** [pulse-nu-rust.vercel.app](https://pulse-nu-rust.vercel.app)  
**Machine feed:** [pulse-nu-rust.vercel.app/api/feed](https://pulse-nu-rust.vercel.app/api/feed)  
**Network:** Arkiv Tiramisu · chain `7738577`

---

When a conventional status page is rewritten or taken offline, the public record goes with it. Pulse stores each alert as a wallet-owned Arkiv entity. A later note is a second entity that points at the first. The site can only read; writes are signed in the browser.

| Property | Mechanism |
|----------|-----------|
| Authorship | `$creator` is the signing wallet |
| History | `kind=update` with `parent=<alert key>` — original body stays |
| Scope | `app=pulse` on every entity |
| Lifetime | `ExpirationTime.fromHours` — self-expiring feed, not a moderator queue |
| Operator power | Deployed app uses a public client only |

Verify any card on the [Tiramisu explorer](https://tiramisu.explorer.arkiv.network).

## Try it

1. Open the [live app](https://pulse-nu-rust.vercel.app).
2. Connect MetaMask (the app adds Tiramisu if needed).
3. Get test GLM from the [faucet](https://hub.arkiv.network/faucet).
4. Publish an alert, then **Add an update** on that card.
5. Open the record page for creator, entity key, and transaction links.
6. Hit [`/api/feed`](https://pulse-nu-rust.vercel.app/api/feed) for the same data as JSON.

## Data model

Full reference: [`arkiv/schema.md`](arkiv/schema.md).

```ts
// Alert — first public statement
attributes: {
  app: "pulse",
  kind: "alert",
  type,           // incident | outage | status | safety
  severity: i32(1..5),
  status, region, title,
}

// Update — append-only note (does not mutate the alert)
attributes: {
  app: "pulse",
  kind: "update",
  parent: alertEntityKey,
  status,         // monitoring | resolved | worsened
  title,
}
```

Read path:

```ts
publicClient
  .select({ key: true, attributes: true, payload: true, creator: true, createdAt: true })
  .where(eq("app", "pulse"))
  .limit(60)
  .fetch()
```

## Repository

```
pulse/
├── arkiv/
│   ├── schema.md          # Entity model & queries
│   └── friction.md        # SDK / Next.js integration notes
├── scripts/
│   └── seed-alerts.ts     # Demo dataset (alerts + updates)
├── src/
│   ├── app/
│   │   ├── page.tsx       # Feed
│   │   ├── alert/[key]/  # Incident record + proof
│   │   ├── api/feed/      # Public JSON API
│   │   ├── post-alert.tsx
│   │   ├── alert-card.tsx
│   │   └── feed-filters.tsx
│   └── lib/
│       ├── arkiv.ts
│       ├── browser-wallet.ts
│       └── pulse-feed.ts
└── package.json
```

## Local development

```bash
npm install
cp .env.example .env.local   # optional; only needed for seeding
npm run dev
```

Seed a demo feed (funded Tiramisu key required):

```bash
npx tsx --env-file=.env.local scripts/seed-alerts.ts
```

## Stack

- Next.js 16 · React 19 · TypeScript
- `@arkiv-network/sdk` 0.8.1 · `viem` 2.57.x
- Deployed on Vercel

## License

[MIT](LICENSE)
