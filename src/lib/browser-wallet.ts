import { createWalletClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { custom, type Hex } from "viem";

export const CHAIN_ID_HEX = "0x7614d1";

export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export function getProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum ?? null;
}

export async function ensureTiramisu(provider: EthereumProvider) {
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

export async function connectAccount() {
  const provider = getProvider();
  if (!provider) throw new Error("No wallet found. Install MetaMask, then reload.");
  await ensureTiramisu(provider);
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];
  return { provider, account: accounts[0] as `0x${string}` };
}

export function walletFor(provider: EthereumProvider, account: `0x${string}`) {
  return createWalletClient({
    chain: tiramisu,
    transport: custom(provider),
    account,
  });
}

type PatchableClient = {
  patchEntity: (args: {
    entityKey: Hex;
    set?: Record<string, string>;
  }) => Promise<unknown>;
};

export async function rememberTx(
  walletClient: PatchableClient,
  entityKey: string,
  txHash: string,
) {
  try {
    await walletClient.patchEntity({
      entityKey: entityKey as Hex,
      set: { tx: txHash },
    });
  } catch {
    // The entity is already public. A missing tx attribute only hides the explorer link.
  }
}
