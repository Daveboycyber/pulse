import Link from "next/link";
import { loadPulseFeed } from "@/lib/pulse-feed";
import { PostAlert } from "./post-alert";
import { FeedFilters } from "./feed-filters";

export const instant = false;

export default async function Home() {
  const alerts = await loadPulseFeed(60);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
                Pulse
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Censorship-resistant public incident &amp; status feed
              </p>
            </div>
            <Link
              href="/api/feed"
              className="text-xs text-zinc-500 hover:text-zinc-300 underline shrink-0 mt-2 transition-colors"
              target="_blank"
            >
              Public JSON API
            </Link>
          </div>

          <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
            Wallet-owned · append-only · self-expiring. The site has no admin
            key — it cannot edit or delete an alert it did not create. Open any
            card for on-chain proof.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-zinc-600">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live on Arkiv Tiramisu
            </span>
            <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1">
              chain 7738577
            </span>
            <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1">
              app = pulse
            </span>
          </div>
        </header>

        <PostAlert />

        <FeedFilters alerts={alerts} />

        <footer className="mt-12 pt-6 border-t border-zinc-900 text-xs text-zinc-600 leading-relaxed">
          Arkiv Tiramisu · chain 7738577 · query app = pulse · wallet-owned ·
          self-expiring · MIT ·{" "}
          <a
            className="underline hover:text-zinc-400 transition-colors"
            href="https://github.com/Daveboycyber/pulse/blob/main/arkiv/schema.md"
            target="_blank"
            rel="noreferrer"
          >
            schema
          </a>
          {" · "}
          <a
            className="underline hover:text-zinc-400 transition-colors"
            href="https://hub.arkiv.network/faucet"
            target="_blank"
            rel="noreferrer"
          >
            faucet
          </a>
        </footer>
      </div>
    </main>
  );
}
