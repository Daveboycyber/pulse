import Link from "next/link";
import { notFound } from "next/navigation";
import { publicClient } from "@/lib/arkiv";
import {
  formatExpiresIn,
  loadAlertByKey,
  readAttrs,
} from "@/lib/pulse-feed";
import { AlertCard } from "../../alert-card";

export const instant = false;

function short(value: string) {
  if (!value) return "";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export default async function AlertDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);
  const alert = await loadAlertByKey(key);
  if (!alert) notFound();

  let raw: Record<string, unknown> | null = null;
  try {
    const entity = await publicClient.getEntity(key as `0x${string}`);
    if (entity) {
      const attrs = readAttrs(entity);
      raw = {
        key: String((entity as any).key ?? key),
        creator: (entity as any).creator
          ? String((entity as any).creator)
          : null,
        owner: (entity as any).owner ? String((entity as any).owner) : null,
        createdAt:
          (entity as any).createdAt != null
            ? String((entity as any).createdAt)
            : null,
        expiresAt:
          (entity as any).expiresAt != null
            ? String((entity as any).expiresAt)
            : null,
        attributes: attrs,
      };
    }
  } catch {
    raw = null;
  }

  const expiresLabel = formatExpiresIn(alert.expiresAt);

  return (
    <>
      <header className="pulse-header">
        <Link href="/" className="pulse-wordmark">
          <span className="pulse-diamond" aria-hidden="true" />
          Pulse
        </Link>
        <nav className="pulse-nav">
          <Link href="/">← Feed</Link>
          <a href="/api/feed" target="_blank" rel="noreferrer">
            JSON API
          </a>
        </nav>
      </header>

      <main className="pulse-page">
        <section className="pulse-intro" style={{ paddingBottom: 20 }}>
          <h1 style={{ fontSize: 24 }}>Incident record</h1>
          <p>
            This page only <em>reads</em> Arkiv. The site has no admin key — it
            cannot rewrite or delete this alert. Updates are separate entities
            linked by parent key; the original text stays.
          </p>
        </section>

        <AlertCard alert={alert} />

        <section className="pulse-card">
          <h2>On-chain proof</h2>
          <p className="pulse-muted pulse-small" style={{ margin: "8px 0 0" }}>
            Wallet-owned · append-only updates · self-expiring
            {expiresLabel ? ` · ${expiresLabel}` : ""}
          </p>
          <dl
            className="font-mono pulse-small pulse-muted"
            style={{ margin: "12px 0 0", lineHeight: 1.7 }}
          >
            <div style={{ marginBottom: 10 }}>
              <dt style={{ opacity: 0.7 }}>Entity key</dt>
              <dd style={{ margin: 0, color: "var(--text)", wordBreak: "break-all" }}>
                {alert.key}
              </dd>
            </div>
            <div style={{ marginBottom: 10 }}>
              <dt style={{ opacity: 0.7 }}>Creator</dt>
              <dd style={{ margin: 0 }}>
                {alert.creator ? (
                  <a
                    href={`https://tiramisu.explorer.arkiv.network/address/${alert.creator}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ wordBreak: "break-all" }}
                  >
                    {alert.creator}
                  </a>
                ) : (
                  "unknown"
                )}
              </dd>
            </div>
            {alert.tx && (
              <div style={{ marginBottom: 10 }}>
                <dt style={{ opacity: 0.7 }}>Create tx</dt>
                <dd style={{ margin: 0 }}>
                  <a
                    href={`https://tiramisu.explorer.arkiv.network/tx/${alert.tx}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ wordBreak: "break-all" }}
                  >
                    {alert.tx}
                  </a>
                </dd>
              </div>
            )}
            {alert.expiresAt && (
              <div style={{ marginBottom: 10 }}>
                <dt style={{ opacity: 0.7 }}>Expires at (Arkiv BTL)</dt>
                <dd style={{ margin: 0, color: "var(--text)" }}>
                  {alert.expiresAt}
                  {expiresLabel ? ` (${expiresLabel})` : ""}
                </dd>
              </div>
            )}
            <div>
              <dt style={{ opacity: 0.7 }}>Updates</dt>
              <dd style={{ margin: 0, color: "var(--text)" }}>
                {alert.updates.length}
              </dd>
            </div>
          </dl>

          {raw && (
            <pre
              className="font-mono"
              style={{
                marginTop: 16,
                fontSize: 11,
                lineHeight: 1.5,
                color: "var(--muted)",
                overflowX: "auto",
                background: "var(--bg)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: 12,
              }}
            >
              {JSON.stringify(raw, null, 2)}
            </pre>
          )}
        </section>

        {alert.updates.length > 0 && (
          <section className="pulse-card">
            <h2>Update entity keys</h2>
            <ul
              className="font-mono pulse-small pulse-muted"
              style={{
                listStyle: "none",
                margin: "12px 0 0",
                padding: 0,
                lineHeight: 1.7,
              }}
            >
              {alert.updates.map((u) => (
                <li key={u.key} style={{ wordBreak: "break-all", marginBottom: 6 }}>
                  <span style={{ color: "var(--text)" }}>{u.status}</span>
                  {" · "}
                  {u.key}
                  {u.creator ? ` · ${short(u.creator)}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}
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
