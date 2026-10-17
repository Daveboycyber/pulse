"use client";

import Link from "next/link";
import { useState } from "react";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { connectAccount, rememberTx, walletFor } from "@/lib/browser-wallet";
import type { AlertRecord, UpdateRecord } from "@/lib/pulse-feed";

export type { AlertRecord, UpdateRecord };

function short(value: string) {
  if (!value) return "";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function explorerTx(tx: string) {
  return `https://tiramisu.explorer.arkiv.network/tx/${tx}`;
}

function explorerAddress(address: string) {
  return `https://tiramisu.explorer.arkiv.network/address/${address}`;
}

function severityStyles(severity: number) {
  if (severity >= 5)
    return {
      border: "border-l-red-500",
      badge: "bg-red-950 text-red-300 border border-red-900/60",
    };
  if (severity >= 4)
    return {
      border: "border-l-orange-500",
      badge: "bg-orange-950 text-orange-300 border border-orange-900/60",
    };
  if (severity >= 3)
    return {
      border: "border-l-amber-500",
      badge: "bg-amber-950 text-amber-300 border border-amber-900/60",
    };
  return {
    border: "border-l-zinc-600",
    badge: "bg-zinc-800 text-zinc-300 border border-zinc-700/60",
  };
}

function updateStatusClass(status: string) {
  if (status === "resolved") return "text-emerald-400";
  if (status === "worsened") return "text-red-400";
  return "text-zinc-400";
}

export function AlertCard({ alert }: { alert: AlertRecord }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("resolved");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const latest = alert.updates[alert.updates.length - 1];
  const sev = severityStyles(alert.severity);

  async function publishUpdate() {
    if (!note.trim()) {
      setMessage("Write what changed.");
      return;
    }
    setBusy(true);
    setMessage("Waiting for wallet signature…");
    try {
      const { provider, account } = await connectAccount();
      const walletClient = walletFor(provider, account);
      const { entityKey, txHash } = await walletClient.createEntity({
        payload: jsonToPayload({ note: note.trim(), source: "pulse-ui" }),
        contentType: "application/json",
        attributes: {
          app: "pulse",
          kind: "update",
          parent: alert.key,
          status,
          title: note.trim().slice(0, 80),
        },
        expires: ExpirationTime.fromHours(72),
      });
      await rememberTx(walletClient as never, entityKey, txHash);
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed.");
      setBusy(false);
    }
  }

  return (
    <article
      className={`border border-zinc-800 border-l-4 ${sev.border} rounded-xl p-5 bg-zinc-900/80`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-medium text-zinc-50 leading-snug">
            <Link
              href={`/alert/${encodeURIComponent(alert.key)}`}
              className="hover:underline"
            >
              {alert.title}
            </Link>
          </h2>
          {alert.description ? (
            <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed line-clamp-3">
              {alert.description}
            </p>
          ) : null}
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-md shrink-0 ${sev.badge}`}
        >
          Sev {alert.severity}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mt-4 text-xs">
        <span className="bg-zinc-800/80 text-zinc-400 px-2 py-1 rounded-md">
          {alert.type}
        </span>
        <span className="bg-zinc-800/80 text-zinc-400 px-2 py-1 rounded-md">
          {alert.region}
        </span>
        <span className="bg-zinc-800/80 text-zinc-400 px-2 py-1 rounded-md">
          opened as {alert.status}
        </span>
        {latest && (
          <span
            className={`bg-zinc-800/80 px-2 py-1 rounded-md ${updateStatusClass(latest.status)}`}
          >
            latest: {latest.status}
          </span>
        )}
        {alert.updates.length > 0 && (
          <span className="bg-zinc-800/80 text-zinc-400 px-2 py-1 rounded-md">
            {alert.updates.length} update
            {alert.updates.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mt-4 text-xs text-zinc-500 space-y-1">
        <p>
          Creator{" "}
          {alert.creator ? (
            <a
              className="font-mono text-zinc-300 underline hover:text-zinc-100 transition-colors"
              href={explorerAddress(alert.creator)}
              target="_blank"
              rel="noreferrer"
            >
              {short(alert.creator)}
            </a>
          ) : (
            "unknown"
          )}
        </p>
        <p className="font-mono break-all text-zinc-600">{alert.key}</p>
        <p className="flex flex-wrap gap-3 pt-0.5">
          <Link
            className="underline text-zinc-300 hover:text-zinc-100 transition-colors"
            href={`/alert/${encodeURIComponent(alert.key)}`}
          >
            Open record
          </Link>
          {alert.tx && (
            <a
              className="underline text-zinc-300 hover:text-zinc-100 transition-colors"
              href={explorerTx(alert.tx)}
              target="_blank"
              rel="noreferrer"
            >
              View alert transaction
            </a>
          )}
        </p>
      </div>

      {alert.updates.length > 0 && (
        <ol className="mt-5 border-l border-zinc-700 ml-1.5 space-y-3">
          {alert.updates.map((update) => (
            <li key={update.key} className="pl-4">
              <p className="text-sm text-zinc-200 leading-relaxed">
                {update.note}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                <span className={updateStatusClass(update.status)}>
                  {update.status}
                </span>
                {update.creator ? ` · ${short(update.creator)}` : ""}
                {update.tx ? (
                  <>
                    {" · "}
                    <a
                      className="underline hover:text-zinc-300 transition-colors"
                      href={explorerTx(update.tx)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      tx
                    </a>
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-4 pt-1">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="text-xs text-zinc-400 hover:text-zinc-200 underline transition-colors"
        >
          {open ? "Close" : "Add an update"}
        </button>
        {open && (
          <div className="mt-3 grid gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
            <p className="text-xs text-zinc-500 leading-relaxed">
              This does not change the alert above. Anyone can add a note. Only
              the note&apos;s owner can delete that note.
            </p>
            <textarea
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 min-h-16"
              placeholder="What changed"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={400}
            />
            <select
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="monitoring">monitoring</option>
              <option value="resolved">resolved</option>
              <option value="worsened">worsened</option>
            </select>
            <button
              type="button"
              onClick={publishUpdate}
              disabled={busy}
              className="bg-zinc-100 text-zinc-950 text-sm font-medium rounded-lg px-3 py-2 hover:bg-white disabled:opacity-50 transition-colors"
            >
              {busy ? "Working…" : "Publish update"}
            </button>
            {message && (
              <p className="text-xs text-zinc-400 break-all">{message}</p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
