import { createWalletClient, ExpirationTime } from "@arkiv-network/sdk";
import { jsonToPayload } from "@arkiv-network/sdk/utils";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { i32 } from "@arkiv-network/sdk/attr";
import "dotenv/config";

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

const walletClient = createWalletClient({
  chain: tiramisu,
  transport: http(),
  account,
});

/** Credible scenarios for judges landing on a non-empty feed. */
const alerts = [
  {
    type: "outage",
    severity: 5,
    status: "active",
    region: "global",
    title: "Major exchange status page offline during deposit halt",
    description:
      "Exchange paused deposits. Their status page returned 503; community reports conflicted with support chat. Recording the halt here so the timeline cannot be quietly rewritten.",
    hours: 48,
    updates: [
      {
        status: "monitoring",
        note: "Deposits still paused. Status page back but incident post was edited twice.",
      },
      {
        status: "worsened",
        note: "Withdrawals also paused. No on-site timeline retained previous wording.",
      },
    ],
  },
  {
    type: "outage",
    severity: 4,
    status: "active",
    region: "ethereum",
    title: "Public RPC providers showing elevated error rates",
    description:
      "eth_call and eth_getLogs failing intermittently on several free RPC endpoints. Wallets and indexers may see false empty results.",
    hours: 24,
    updates: [
      {
        status: "monitoring",
        note: "Two providers recovered. One still elevating 429s under load.",
      },
      {
        status: "resolved",
        note: "Error rates back to baseline across monitored endpoints.",
      },
    ],
  },
  {
    type: "incident",
    severity: 4,
    status: "active",
    region: "global",
    title: "Bridge deposit finality slower than usual",
    description:
      "Inbound transfers on a major bridge taking longer than advertised finality. No confirmed fund loss; monitoring queues and operator statements.",
    hours: 36,
    updates: [
      {
        status: "monitoring",
        note: "Operator acknowledged backlog. Official status still shows green.",
      },
    ],
  },
  {
    type: "safety",
    severity: 3,
    status: "monitoring",
    region: "global",
    title: "Phishing domain mimicking official status URL",
    description:
      "Lookalike domain serving a fake ‘all systems normal’ page during a real incident window. Do not trust status links from unverified DMs.",
    hours: 72,
    updates: [
      {
        status: "monitoring",
        note: "Domain still resolving. Report filed with registrar where possible.",
      },
    ],
  },
  {
    type: "status",
    severity: 2,
    status: "active",
    region: "global",
    title: "Scheduled maintenance: indexer re-sync window",
    description:
      "Non-critical maintenance. API may lag 10–20 minutes. No write path impact expected.",
    hours: 48,
    updates: [],
  },
  {
    type: "incident",
    severity: 5,
    status: "active",
    region: "nigeria",
    title: "Regional ISP routing issues affecting exchange access",
    description:
      "Users in parts of NG reporting inability to reach a major CEX web app while mobile data works for other sites. Could be local filtering or upstream routing.",
    hours: 24,
    updates: [
      {
        status: "monitoring",
        note: "Still region-specific. App status page shows global green.",
      },
    ],
  },
];

async function rememberTx(entityKey: `0x${string}`, txHash: string) {
  try {
    await walletClient.patchEntity({
      entityKey,
      set: { tx: txHash },
    });
  } catch {
    // Entity is public even if the tx attribute is missing.
  }
}

async function main() {
  if (!process.env.PRIVATE_KEY) {
    console.error("Set PRIVATE_KEY in .env.local (never commit it).");
    process.exit(1);
  }

  console.log("Using wallet:", account.address);
  console.log("Seeding Pulse alerts + append-only updates...\n");

  for (const alert of alerts) {
    const { entityKey, txHash } = await walletClient.createEntity({
      payload: jsonToPayload({
        description: alert.description,
        source: "pulse-seed",
      }),
      contentType: "application/json",
      attributes: {
        app: "pulse",
        kind: "alert",
        type: alert.type,
        severity: i32(alert.severity),
        status: alert.status,
        region: alert.region,
        title: alert.title,
      },
      expires: ExpirationTime.fromHours(alert.hours),
    });

    await rememberTx(entityKey, txHash);

    console.log(`✓ alert  ${alert.title}`);
    console.log(`  key: ${entityKey}`);
    console.log(`  tx:  ${txHash}`);

    for (const update of alert.updates) {
      const result = await walletClient.createEntity({
        payload: jsonToPayload({
          note: update.note,
          source: "pulse-seed",
        }),
        contentType: "application/json",
        attributes: {
          app: "pulse",
          kind: "update",
          parent: entityKey,
          status: update.status,
          title: update.note.slice(0, 80),
        },
        expires: ExpirationTime.fromHours(72),
      });
      await rememberTx(result.entityKey, result.txHash);
      console.log(`  └ update [${update.status}] ${result.entityKey}`);
    }

    console.log("");
  }

  console.log("Done. Open https://pulse-nu-rust.vercel.app and hard-refresh.");
}

main().catch(console.error);
