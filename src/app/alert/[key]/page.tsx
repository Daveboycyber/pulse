import Link from "next/link";
import { notFound } from "next/navigation";
import { publicClient } from "@/lib/arkiv";
import { loadAlertByKey, readAttrs } from "@/lib/pulse-feed";
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
        creator: (entity as any).creator ? String((entity as any).creator) : null,
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

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-zinc-400 underline">
            ← Back to feed
          </Link>
          <a
            className="text-sm text-zinc-400 underline"
            href="/api/feed"
            target="_blank"
            rel="noreferrer"
          >
            Public JSON API
          </a>
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">Incident record</h1>
          <p className="text-sm text-zinc-500">
            This page is a view over Arkiv entities. The site cannot rewrite the
            original alert. Updates are separate entities linked by parent key.
          </p>
        </div>

        <AlertCard alert={alert} />

        <section className="border border-zinc-800 rounded-lg p-5 bg-zinc-900">
          <h2 className="text-sm font-semibold mb-3">On-chain proof</h2>
          <dl className="text-xs text-zinc-400 space-y-2 font-mono break-all">
            <div>
              <dt className="text-zinc-500">Entity key</dt>
              <dd className="text-zinc-200">{alert.key}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Creator</dt>
              <dd>
                {alert.creator ? (
                  <a
                    className="underline text-zinc-200"
                    href={`https://tiramisu.explorer.arkiv.network/address/${alert.creator}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {alert.creator}
                  </a>
                ) : (
                  "unknown"
                )}
              </dd>
            </div>
            {alert.tx && (
              <div>
                <dt className="text-zinc-500">Create tx</dt>
                <dd>
                  <a
                    className="underline text-zinc-200"
                    href={`https://tiramisu.explorer.arkiv.network/tx/${alert.tx}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {alert.tx}
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-zinc-500">Updates</dt>
              <dd className="text-zinc-200">{alert.updates.length}</dd>
            </div>
          </dl>

          {raw && (
            <pre className="mt-4 text-[11px] leading-relaxed text-zinc-500 overflow-x-auto bg-zinc-950 border border-zinc-800 rounded p-3">
              {JSON.stringify(raw, null, 2)}
            </pre>
          )}
        </section>

        {alert.updates.length > 0 && (
          <section className="border border-zinc-800 rounded-lg p-5 bg-zinc-900">
            <h2 className="text-sm font-semibold mb-3">Update entity keys</h2>
            <ul className="text-xs font-mono text-zinc-400 space-y-2 break-all">
              {alert.updates.map((u) => (
                <li key={u.key}>
                  <span className="text-zinc-300">{u.status}</span>
                  {" · "}
                  {u.key}
                  {u.creator ? ` · ${short(u.creator)}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
