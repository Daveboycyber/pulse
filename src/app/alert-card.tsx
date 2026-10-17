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

export function AlertCard({ alert }: { alert: AlertRecord }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("resolved");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const latest = alert.updates[alert.updates.length - 1];

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
    <article className="border border-zinc-800 rounded-lg p-5 bg-zinc-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            <Link
              href={`/alert/${encodeURIComponent(alert.key)}`}
              className="hover:underline"
            >
              {alert.title}
            </Link>
          </h2>
          <p className="text-sm text-zinc-400 mt-1">{alert.description}</p>
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded shrink-0 ${
            alert.severity >= 4
              ? "bg-red-900/50 text-red-300"
              : alert.severity >= 3
                ? "bg-orange-900/50 text-orange-300"
                : "bg-zinc-800 text-zinc-300"
          }`}
        >
          Sev {alert.severity}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 mt-4 text-xs text-zinc-500">
        <span className="bg-zinc-800 px-2 py-1 rounded">{alert.type}</span>
        <span className="bg-zinc-800 px-2 py-1 rounded">{alert.region}</span>
        <span className="bg-zinc-800 px-2 py-1 rounded">opened as {alert.status}</span>
        {latest && (
          <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">
            latest note: {latest.status}
          </span>
        )}
        {alert.updates.length > 0 && (
          <span className="bg-zinc-800 px-2 py-1 rounded">
            {alert.updates.length} update{alert.updates.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mt-4 text-xs text-zinc-500 space-y-1">
        <p>
          Creator{" "}
          {alert.creator ? (
            <a
              className="font-mono text-zinc-300 underline"
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
        <p className="font-mono break-all">Entity {alert.key}</p>
        <p className="flex flex-wrap gap-3">
          <Link
            className="underline text-zinc-300"
            href={`/alert/${encodeURIComponent(alert.key)}`}
          >
            Open record
          </Link>
          {alert.tx && (
            <a
              className="underline text-zinc-300"
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
        <ol className="mt-4 border-l border-zinc-700 ml-2 space-y-3">
          {alert.updates.map((update) => (
            <li key={update.key} className="pl-4">
              <p className="text-sm text-zinc-200">{update.note}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {update.status}
                {update.creator ? ` · ${short(update.creator)}` : ""}
                {update.tx ? (
                  <>
                    {" · "}
                    <a
                      className="underline"
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

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="text-xs text-zinc-300 underline"
        >
          {open ? "Close" : "Add an update"}
        </button>
        {open && (
          <div className="mt-3 grid gap-2">
            <p className="text-xs text-zinc-500">
              This does not change the alert above. Anyone can add a note. Only
              the note&apos;s owner can delete that note.
            </p>
            <textarea
              className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm min-h-16"
              placeholder="What changed"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={400}
            />
            <select
              className="bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm"
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
              className="bg-zinc-100 text-zinc-950 text-sm font-medium rounded px-3 py-2 disabled:opacity-50"
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
