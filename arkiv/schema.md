# Pulse – Arkiv Schema

Pulse is an append-only public incident record on Arkiv Tiramisu.

The website has no admin key. It cannot edit or delete an alert it did not create. A later note never rewrites the first record.

## Entity kinds

Every Pulse entity carries `app = "pulse"` so queries stay scoped on a shared testnet.

### 1. `kind = "alert"`

The first public statement about an incident. Once written, the product treats it as fixed history. Status changes and corrections are not patches on this entity.

| Attribute | Type | Purpose | Examples |
|-----------|------|---------|----------|
| `app` | string | Namespace | `pulse` |
| `kind` | string | Entity role | `alert` |
| `type` | string | Category | `incident`, `outage`, `status`, `safety` |
| `severity` | i32 | Priority 1–5 | `1` … `5` |
| `status` | string | Opening state | `active`, `monitoring` |
| `region` | string | Scope | `global`, `ethereum` |
| `title` | string | Short label | `Elevated RPC latency on public endpoints` |
| `tx` | string | Creation tx hash (optional, set after create) | `0x…` |

**Payload (JSON):**

```json
{
  "description": "Multiple public RPC providers reporting high latency. Investigating.",
  "source": "pulse-ui"
}
```

**Expiration:** product feature. High severity uses a shorter window so the feed stays current without a moderator.

| Severity | Suggested lifetime |
|----------|--------------------|
| 5 | 12 hours |
| 4 | 24 hours |
| 1–3 | 48–72 hours |

### 2. `kind = "update"`

A second entity that points at an alert. It does not mutate the parent. Anyone can publish an update. Only the update’s owner can delete that update entity.

| Attribute | Type | Purpose | Examples |
|-----------|------|---------|----------|
| `app` | string | Namespace | `pulse` |
| `kind` | string | Entity role | `update` |
| `parent` | string | Entity key of the alert | `0x…` |
| `status` | string | Note class | `monitoring`, `resolved`, `worsened` |
| `title` | string | Short note (UI convenience) | first 80 chars of the note |
| `tx` | string | Creation tx hash (optional) | `0x…` |

**Payload (JSON):**

```json
{
  "note": "Latency returned to baseline after provider failover.",
  "source": "pulse-ui"
}
```

**Expiration:** default 72 hours on UI posts so notes outlive short-lived critical alerts long enough to be read.

## System fields used as product features

| Field | Role |
|-------|------|
| `$creator` | Wallet that signed the write. Provenance without an account system. |
| `$owner` | Can delete or patch that entity only. |
| `$createdAt` / `$expiresAt` | Ordering and self-pruning. |

## Queries the app runs

```ts
publicClient
  .select({ key: true, attributes: true, payload: true, creator: true, createdAt: true })
  .where(eq("app", "pulse"))
  .limit(40)
  .fetch()
```

Client-side grouping:

- `kind === "alert"` → feed cards (skip empty titles)
- `kind === "update"` → attach to `parent`

Other useful filters the model supports:

- High-severity alerts: `app = "pulse" && kind = "alert" && severity >= 4`
- Region: `app = "pulse" && region = "ethereum"`
- Notes on one incident: `app = "pulse" && kind = "update" && parent = "<entityKey>"`
- Authorship: filter on `$creator`

## Censorship-resistance properties

1. **No operator key on the site.** The deployed Next.js app only constructs a public client. Writes are signed in the browser.
2. **Append-only history.** Resolutions are new entities. The original alert body stays readable until its own expiry.
3. **Wallet ownership.** Only the owner of an entity can delete it. A third party cannot erase someone else’s alert or note.
4. **Public read.** Any client can query `app = "pulse"` without credentials.
5. **Self-expiring.** Stale records leave without a moderator queue.

## Explorer

- Address: `https://tiramisu.explorer.arkiv.network/address/<wallet>`
- Transaction: `https://tiramisu.explorer.arkiv.network/tx/<txHash>`

Seed wallet: `0xF3c74846784d5f379f1366D4d78859db9f2E2819` (Tiramisu, chain ID 7738577).
