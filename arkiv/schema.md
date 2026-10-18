# Arkiv data model

Pulse stores an append-only public incident feed on Arkiv Tiramisu.

The web app has no admin key. It cannot edit or delete an alert it did not create. A later note never rewrites the first record.

## Entity kinds

Every entity carries `app = "pulse"` so queries stay scoped on a shared network.

### `kind = "alert"`

The first public statement about an incident. Treated as fixed history. Status changes and corrections are not patches on this entity.

| Attribute | Type | Purpose | Examples |
|-----------|------|---------|----------|
| `app` | string | Namespace | `pulse` |
| `kind` | string | Role | `alert` |
| `type` | string | Category | `incident`, `outage`, `status`, `safety` |
| `severity` | i32 | Priority 1–5 | `1` … `5` |
| `status` | string | Opening state | `active`, `monitoring` |
| `region` | string | Scope | `global`, `ethereum` |
| `title` | string | Short label | `Elevated RPC latency on public endpoints` |
| `tx` | string | Creation tx (optional, set after create) | `0x…` |

**Payload (JSON):**

```json
{
  "description": "Multiple public RPC providers reporting high latency. Investigating.",
  "source": "pulse-ui"
}
```

**Expiration** is a product rule. Higher severity uses a shorter window so the feed stays current without a moderator.

| Severity | Suggested lifetime |
|----------|--------------------|
| 5 | 12 hours |
| 4 | 24 hours |
| 1–3 | 48–72 hours |

### `kind = "update"`

A second entity that points at an alert. It does not mutate the parent. Anyone can publish an update. Only that update’s owner can delete it.

| Attribute | Type | Purpose | Examples |
|-----------|------|---------|----------|
| `app` | string | Namespace | `pulse` |
| `kind` | string | Role | `update` |
| `parent` | string | Alert entity key | `0x…` |
| `status` | string | Note class | `monitoring`, `resolved`, `worsened` |
| `title` | string | Short note | first 80 chars |
| `tx` | string | Creation tx (optional) | `0x…` |

**Payload (JSON):**

```json
{
  "note": "Latency returned to baseline after provider failover.",
  "source": "pulse-ui"
}
```

Default UI lifetime for updates: 72 hours.

## System fields

| Field | Role |
|-------|------|
| `$creator` | Wallet that signed the write |
| `$owner` | May delete or patch that entity only |
| `$createdAt` / `$expiresAt` | Ordering and self-pruning |

## Queries

```ts
publicClient
  .select({ key: true, attributes: true, payload: true, creator: true, createdAt: true })
  .where(eq("app", "pulse"))
  .limit(60)
  .fetch()
```

Grouping in the app:

- `kind === "alert"` → feed cards (empty titles skipped)
- `kind === "update"` → attached under `parent`

Other useful filters:

- High severity: `app = "pulse" && kind = "alert" && severity >= 4`
- Region: `app = "pulse" && region = "ethereum"`
- Notes on one incident: `app = "pulse" && kind = "update" && parent = "<entityKey>"`
- Authorship: `$creator`

## Design properties

1. **No operator key on the site** — public client for reads; browser wallets for writes.
2. **Append-only history** — resolutions are new entities; the original body remains until its own expiry.
3. **Wallet ownership** — only the entity owner can delete it.
4. **Public read** — `app = "pulse"` needs no credentials.
5. **Self-expiring** — stale records leave without a queue.

## Explorer

- Address: `https://tiramisu.explorer.arkiv.network/address/<wallet>`
- Transaction: `https://tiramisu.explorer.arkiv.network/tx/<txHash>`

Example seed wallet on Tiramisu (chain `7738577`): `0xF3c74846784d5f379f1366D4d78859db9f2E2819`.
