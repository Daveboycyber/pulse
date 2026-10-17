"use client";

import { useMemo, useState } from "react";
import { AlertCard, type AlertRecord } from "./alert-card";

export function FeedFilters({ alerts }: { alerts: AlertRecord[] }) {
  const [minSeverity, setMinSeverity] = useState(1);
  const [type, setType] = useState("all");
  const [region, setRegion] = useState("all");
  const [history, setHistory] = useState("all");

  const types = useMemo(
    () => Array.from(new Set(alerts.map((a) => a.type))).sort(),
    [alerts],
  );
  const regions = useMemo(
    () => Array.from(new Set(alerts.map((a) => a.region))).sort(),
    [alerts],
  );

  const filtered = alerts.filter((alert) => {
    if (alert.severity < minSeverity) return false;
    if (type !== "all" && alert.type !== type) return false;
    if (region !== "all" && alert.region !== region) return false;
    if (history === "with-updates" && alert.updates.length === 0) return false;
    if (history === "unresolved") {
      const latest = alert.updates[alert.updates.length - 1];
      if (latest?.status === "resolved") return false;
    }
    return true;
  });

  function resetFilters() {
    setMinSeverity(1);
    setType("all");
    setRegion("all");
    setHistory("all");
  }

  const filtersActive =
    minSeverity > 1 || type !== "all" || region !== "all" || history !== "all";

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="text-xs text-zinc-500">
          Min severity
          <select
            className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
            value={minSeverity}
            onChange={(e) => setMinSeverity(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-zinc-500">
          Type
          <select
            className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">all</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-zinc-500">
          Region
          <select
            className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="all">all</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-zinc-500">
          History
          <select
            className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
            value={history}
            onChange={(e) => setHistory(e.target.value)}
          >
            <option value="all">all</option>
            <option value="with-updates">has updates</option>
            <option value="unresolved">not resolved</option>
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-xs text-zinc-500">
          Showing {filtered.length} of {alerts.length} alerts
        </p>
        {filtersActive && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-zinc-400 underline hover:text-zinc-200 transition-colors"
          >
            Reset filters
          </button>
        )}
      </div>

      <div className="space-y-4">
        {alerts.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
            <p className="text-sm text-zinc-300 font-medium">
              No public alerts yet
            </p>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed max-w-sm mx-auto">
              Be the first to post one from your wallet. Records are
              wallet-owned and self-expiring on Arkiv Tiramisu.
            </p>
          </div>
        )}
        {alerts.length > 0 && filtered.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
            <p className="text-sm text-zinc-300 font-medium">
              No alerts match these filters
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 text-xs text-zinc-400 underline hover:text-zinc-200 transition-colors"
            >
              Reset filters
            </button>
          </div>
        )}
        {filtered.map((alert) => (
          <AlertCard key={alert.key} alert={alert} />
        ))}
      </div>
    </div>
  );
}
