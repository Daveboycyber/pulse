# Pulse – Arkiv Schema

## Entity: `alert`

Core record for the public incident & status feed.

### Attributes

| Name       | Type    | Purpose                                      | Example values                          |
|------------|---------|----------------------------------------------|-----------------------------------------|
| type       | string  | Category of the alert                        | `incident`, `outage`, `status`, `safety` |
| severity   | number  | Priority (1–5). Enables range queries        | `1`, `2`, `3`, `4`, `5`                  |
| status     | string  | Current state of the alert                   | `active`, `resolved`, `monitoring`      |
| region     | string  | Geographic or network scope                  | `global`, `ethereum`, `mumbai`, ...     |
| title      | string  | Short human-readable title                   | `"RPC latency spike on mainnet"`        |

### Payload

Short description (JSON). Keep small (well under 128 KiB).

```json
{
  "description": "Elevated latency observed on public RPC endpoints. Investigating.",
  "source": "community"
}
```

### System attributes used

- `$creator` / `$owner` — verifiable authorship (wallet that posted the alert)
- `$createdAt` / `$expiresAt` — time-based filtering and cleanup

### Expiration strategy (product feature, not housekeeping)

| Severity | Suggested lifetime | Rationale                          |
|----------|--------------------|------------------------------------|
| 5        | 12 hours           | Critical – keep the feed focused   |
| 4        | 24 hours           | High priority                      |
| 1–3      | 48–72 hours        | Lower priority / longer context    |

Users can choose a shorter or longer window at creation time and extend if still relevant.

### Key queries

- Active high-severity alerts  
  `type = "incident" && severity >= 4 && status = "active"`

- By region + active  
  `region = "ethereum" && status = "active"`

- Recent alerts by a specific author  
  Filter on `$creator`

- Everything still live  
  `status = "active"`

### Design decisions

- **One primary entity type** keeps the model shippable.
- Attributes are the only things we query on; payload carries free-form text.
- Expiration is intentional: old incidents disappear so the feed never fills with noise.
- Wallet ownership + `$creator` give on-chain provenance without extra contracts.
- Nothing sensitive or personal is stored. Synthetic / public status data only.

### Wallet that created the seed entities

`0xF3c74846784d5f379f1366D4d78859db9f2E2819` on Tiramisu (chain ID 7738577).
