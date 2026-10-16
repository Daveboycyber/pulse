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
    description: "Multiple public RPC providers reporting high latency. Investigating.",
    hours: 12,
  },
  {
    type: "incident",
    severity: 4,
    status: "active",
    region: "global",
    title: "Intermittent finality delays",
    description: "Some blocks taking longer than usual to finalize. Monitoring.",
    hours: 24,
  },
  {
    type: "status",
    severity: 2,
    status: "active",
    region: "global",
    title: "Scheduled maintenance window announced",
    description: "Non-critical maintenance planned for next 48h. No expected downtime.",
    hours: 48,
  },
  {
    type: "safety",
    severity: 3,
    status: "monitoring",
    region: "ethereum",
    title: "Unusual gas spike observed",
    description: "Gas prices elevated due to high demand. No protocol issue detected.",
    hours: 36,
  },
  {
    type: "incident",
    severity: 4,
    status: "active",
    region: "global",
    title: "Bridge monitoring increased",
    description: "Temporary increase in monitoring on major bridges after unusual volume.",
    hours: 24,
  },
  {
    type: "status",
    severity: 1,
    status: "active",
    region: "global",
    title: "All core services nominal",
    description: "Routine status check – everything operating normally.",
    hours: 72,
  },
];

async function main() {
  console.log("Using wallet:", account.address);
  console.log("Seeding Pulse alerts (kind=alert)...\n");

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
        tx: txHash,
      },
      expires: ExpirationTime.fromHours(alert.hours),
    });

    console.log(`\u2713 ${alert.title}`);
    console.log(`  key: ${entityKey}`);
    console.log(`  tx:  ${txHash}\n`);
  }

  console.log("Done. All alerts written to Tiramisu.");
}

main().catch(console.error);
