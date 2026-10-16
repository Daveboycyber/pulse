"use client";

import { useState } from "react";
import { createWalletClient } from "@arkiv-network/sdk";
import { i32 } from "@arkiv-network/sdk/attr";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { custom } from "viem";

const CHAIN_ID_HEX = "0x7614d1";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function getProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum ?? null;
}

async function ensureTiramisu(provider: EthereumProvider) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: CHAIN_ID_HEX,
          chainName: "Arkiv Tiramisu",
          nativeCurrency: { name: "GLM", symbol: "GLM", decimals: 18 },
          rpcUrls: ["https://rpc.tiramisu.db-chain.testnet.arkiv.network"],
          blockExplorerUrls: ["https://tiramisu.explorer.arkiv.network"],
        },
      ],
    });
  }
}

export function PostAlert() {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("incident");
  const [severity, setSeverity] = useState(3);
  const [region, setRegion] = useState("global");
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function connect() {
    const provider = getProvider();
    if (!provider) {
      setMessage("No wallet found. Install MetaMask, then reload.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await ensureTiramisu(provider);
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      setAccount(accounts[0] as `0x${string}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Wallet connection failed.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    const provider = getProvider();
    if (!provider || !account) return;
    if (!title.trim() || !description.trim()) {
      setMessage("Title and description are required.");
      return;
    }
    setBusy(true);
    setMessage("Waiting for wallet signature…");
    try {
      await ensureTiramisu(provider);
      const walletClient = createWalletClient({
        chain: tiramisu,
        transport: custom(provider),
        account,
      });
      const { entityKey } = await walletClient.createEntity({
        payload: jsonToPayload({
          description: description.trim(),
          source: "pulse-ui",
        }),
        contentType: "application/json",
        attributes: {
          app: "pulse",
          type,
          severity: i32(severity),
          status: "active",
          region: region.trim() || "global",
          title: title.trim(),
        },
        expires: ExpirationTime.fromHours(hours),
      });
      setMessage(`Posted ${entityKey}. Reloading…`);
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Post failed.");
      setBusy(false);
    }
  }

  return (
    <section className="border border-zinc-800 rounded-lg p-5 bg-zinc-900 mb-8">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold">Post an alert</h2>
        {account ? (
          <span className="text-xs text-zinc-400 font-mono">
            {account.slice(0, 6)}…{account.slice(-4)}
          </span>
        ) : (
          <button
            type="button"
            onClick={connect}
            disabled={busy}
            className="text-sm bg-zinc-100 text-zinc-950 px-3 py-1.5 rounded disabled:opacity-50"
          >
            Connect wallet
          </button>
        )}
      </div>

      <p className="text-xs text-zinc-500 mb-4">
        Your wallet signs the write. The alert is owned by you and expires on its own.
        The wallet needs test GLM from{" "}
        <a
          className="underline"
          href="https://hub.arkiv.network/faucet"
          target="_blank"
          rel="noreferrer"
        >
          the faucet
        </a>
        .
      </p>

      <div className="grid gap-3">
        <input
          className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
        <textarea
          className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm min-h-20"
          placeholder="What happened"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="text-xs text-zinc-500">
            Type
            <select
              className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm text-zinc-100"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="incident">incident</option>
              <option value="outage">outage</option>
              <option value="status">status</option>
              <option value="safety">safety</option>
            </select>
          </label>
          <label className="text-xs text-zinc-500">
            Severity
            <select
              className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm text-zinc-100"
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-zinc-500">
            Region
            <input
              className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              maxLength={32}
            />
          </label>
          <label className="text-xs text-zinc-500">
            Expires in
            <select
              className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm text-zinc-100"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            >
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
              <option value={72}>72 hours</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={account ? publish : connect}
          disabled={busy}
          className="bg-zinc-100 text-zinc-950 text-sm font-medium rounded px-3 py-2 disabled:opacity-50"
        >
          {busy ? "Working…" : account ? "Publish to Arkiv" : "Connect wallet to publish"}
        </button>
        {message && <p className="text-xs text-zinc-400 break-all">{message}</p>}
      </div>
    </section>
  );
}
