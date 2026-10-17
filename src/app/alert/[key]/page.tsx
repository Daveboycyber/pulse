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

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm text-zinc-400 underline hover:text-zinc-200 transition-colors"
          >
            ← Back to feed
          </Link>
          <a
            className="text-sm text-zinc-500 underline hover:text-zinc-300 transition-colors"
            href="/api/feed"
            target="_blank"
            rel="noreferrer"
          >
            Public JSON API
          </a>
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 mb-2">
            Incident record
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-xl">
            This page is a view over Arkiv entities. The site cannot rewrite the
            original alert. Updates are separate entities linked by parent key.
          </p>
        </div>

        <AlertCard alert={alert} />

        <section className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/80">
          <h2 className="text-sm font-medium text-zinc-200 mb-4">
            On-chain proof
          </h2>
          <dl className="text-xs text-zinc-400 space-y-3 font-mono break-all">
            <div>
              <dt className="text-zinc-600 mb-0.5">Entity key</dt>
              <dd className="text-zinc-200">{alert.key}</dd>
            </div>
            <div>
              <dt className="text-zinc-600 mb-0.5">Creator</dt>
              <dd>
                {alert.creator ? (
                  <a
                    className="underline text-zinc-200 hover:text-white transition-colors"
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
                <dt className="text-zinc-600 mb-0.5">Create tx</dt>
                <dd>
                  <a
                    className="underline text-zinc-200 hover:text-white transition-colors"
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
              <dt className="text-zinc-600 mb-0.5">Updates</dt>
              <dd className="text-zinc-200">{alert.updates.length}</dd>
            </div>
          </dl>

          {raw && (
            <pre className="mt-5 text-[11px] leading-relaxed text-zinc-500 overflow-x-auto bg-zinc-950 border border-zinc-800 rounded-lg p-3">
              {JSON.stringify(raw, null, 2)}
            </pre>
          )}
        </section>

        {alert.updates.length > 0 && (
          <section className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/80">
            <h2 className="text-sm font-medium text-zinc-200 mb-3">
              Update entity keys
            </h2>
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
