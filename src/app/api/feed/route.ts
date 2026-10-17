import { NextResponse } from "next/server";
import { loadPulseFeed } from "@/lib/pulse-feed";

export async function GET() {
  try {
    const alerts = await loadPulseFeed(60);
    return NextResponse.json(
      {
        network: "tiramisu",
        chainId: 7738577,
        app: "pulse",
        generatedAt: new Date().toISOString(),
        count: alerts.length,
        alerts,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load feed",
      },
      { status: 500 },
    );
  }
}
