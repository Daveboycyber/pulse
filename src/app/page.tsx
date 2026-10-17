import Link from "next/link";
import { loadPulseFeed } from "@/lib/pulse-feed";
import { PostAlert } from "./post-alert";
import { FeedFilters } from "./feed-filters";

export const instant = false;

export default async function Home() {
  const alerts = await loadPulseFeed(60);

  return (
    <>
      <header className="pulse-header">
        <span className="pulse-wordmark">
          <span className="pulse-diamond" aria-hidden="true" />
          Pulse
        </span>
        <nav className="pulse-nav">
          <span className="pulse-live" title="Reading from Arkiv Tiramisu">
            <span className="dot" aria-hidden="true" />
            Live
          </span>
          <Link href="/api/feed" target="_blank">
            JSON API
          </Link>
          <a
            href="https://github.com/Daveboycyber/pulse"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </header>

      <main className="pulse-page">
        <section className="pulse-intro">
          <h1>
            When an outage page is rewritten or taken offline, the public record
            disappears with it.
          </h1>
          <p>
            Pulse is a public incident feed many wallets can write to. Updates
            are separate records — they never overwrite the original. The website
            has <strong>no admin key</strong>: it cannot edit or delete an alert
            it did not create.
          </p>
          <p className="pulse-muted" style={{ marginBottom: 12 }}>
            Built for the moment an exchange, RPC provider, or status host wants
            the story gone. The feed lives as wallet-owned entities on Arkiv
            Tiramisu — not on this server.
          </p>
          <p className="pulse-muted pulse-small" style={{ marginBottom: 0 }}>
            Reading live from Arkiv · chain 7738577 · app = pulse · self-expiring
            ·{" "}
            <a
              href="https://tiramisu.explorer.arkiv.network"
              target="_blank"
              rel="noreferrer"
            >
              explorer ↗
            </a>
          </p>
        </section>

        <PostAlert />

        <FeedFilters alerts={alerts} />
      </main>

      <footer className="pulse-footer">
        <span>MIT licensed · built for Arkiv: Global Tour Stop</span>
        <span className="links">
          <a
            href="https://github.com/Daveboycyber/pulse/blob/main/arkiv/schema.md"
            target="_blank"
            rel="noreferrer"
          >
            Arkiv schema
          </a>
          <a
            href="https://hub.arkiv.network/faucet"
            target="_blank"
            rel="noreferrer"
          >
            Faucet
          </a>
          <a
            href="https://github.com/Daveboycyber/pulse"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </span>
      </footer>
    </>
  );
}
