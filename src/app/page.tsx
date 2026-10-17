import Link from "next/link";
import { loadPulseFeed } from "@/lib/pulse-feed";
import { PostAlert } from "./post-alert";
import { FeedFilters } from "./feed-filters";

export const instant = false;

export default async function Home() {
  const alerts = await loadPulseFeed(60);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-3xl font-bold">Pulse</h1>
          <Link
            href="/api/feed"
            className="text-xs text-zinc-400 underline shrink-0 mt-2"
            target="_blank"
          >
            Public JSON API
          </Link>
        </div>
        <p className="text-zinc-400 mb-3">
          A public incident record. The site has no admin key. It cannot edit or
          delete an alert it did not create.
        </p>
        <p className="text-sm text-zinc-500 mb-8">
          An alert is one Arkiv entity. A correction is a second entity that
          points at the first. The original text stays. Both expire on their own.
          Open any card for on-chain proof.
        </p>

        <PostAlert />

        <FeedFilters alerts={alerts} />

        <p className="text-xs text-zinc-600 mt-10">
          Arkiv Tiramisu · chain 7738577 · query app = pulse · wallet-owned ·
          self-expiring · machine-readable at /api/feed
        </p>
      </div>
    </main>
  );
}
