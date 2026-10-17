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

const alerts = [
  {
    type: "outage",
    severity: 5,
    status: "active",
    region: "ethereum",
    title: "Elevated RPC latency on public endpoints",
    description:
      "Multiple public RPC providers reporting high latency. Investigating.",
    hours: 12,
    updates: [
      {
        status: "monitoring",
        note: "Latency still elevated on two providers. Failover paths healthy.",
      },
      {
        status: "resolved",
        note: "Providers recovered. Residual queue drain complete.",
      },
    ],
  },
  {
    type: "incident",
    severity: 4,
    status: "active",
    region: "global",
    title: "Intermittent finality delays",
    description:
      "Some blocks taking longer than usual to finalize. Monitoring.",
    hours: 24,
    updates: [
      {
        status: "worsened",
        note: "Finality lag widened during peak load. No reorgs observed.",
      },
    ],
  },
  {
    type: "status",
    severity: 2,
    status: "active",
    region: "global",
    title: "Scheduled maintenance window announced",
    description:
      "Non-critical maintenance planned for next 48h. No expected downtime.",
    hours: 48,
    updates: [],
  },
  {
    type: "safety",
    severity: 3,
    status: "monitoring",
    region: "ethereum",
    title: "Unusual gas spike observed",
    description:
      "Gas prices elevated due to high demand. No protocol issue detected.",
    hours: 36,
    updates: [
      {
        status: "monitoring",
        note: "Spike correlated with a large NFT mint batch. Protocol metrics normal.",
      },
    ],
  },
  {
    type: "incident",
    severity: 4,
    status: "active",
    region: "global",
    title: "Bridge monitoring increased",
    description:
      "Temporary increase in monitoring on major bridges after unusual volume.",
    hours: 24,
    updates: [
      {
        status: "resolved",
        note: "Volume returned to baseline. Extra monitors kept for 24h.",
      },
    ],
  },
  {
    type: "status",
    severity: 1,
    status: "active",
    region: "global",
    title: "All core services nominal",
    description: "Routine status check \u2013 everything operating normally.",
    hours: 72,
    updates: [],
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

    console.log(`\u2713 alert  ${alert.title}`);
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
      console.log(`  \u2514 update [${update.status}] ${result.entityKey}`);
    }

    console.log("");
  }

  console.log("Done. Alerts and update history written to Tiramisu.");
}

main().catch(console.error);
