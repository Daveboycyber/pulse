import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { http } from "viem";

export const publicClient = createPublicClient({
  chain: tiramisu,
  transport: http(),
});