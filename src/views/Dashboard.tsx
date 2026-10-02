/**
 * Dashboard: the plugin home (spec 002 shell; spec 007 completes it).
 *
 * Shows the connection list with the active connection, per-connection
 * actions, and the empty state. All data flows through the storage layer;
 * no platform calls happen here.
 */

import { useCallback, useEffect, useState } from "react"
import { Modal } from "../components/ui/Modal"
import { HelpTooltip } from "../components/ui/HelpTooltip"
import {
  deleteConnection,
  listConnections,
  revalidateConnection,
  setActiveConnection,
  type ConnectionRecord,
  type ValidationState,
} from "../storage/connections"
import {
  CONNECTION_STATE_LABELS,
  KEY_SCOPE_LABELS,
  formatErrorSentence,
} from "./ConnectionModal"

interface DashboardProps {
  /** Bumped by the app shell whenever a modal save changes the data. */
  dataVersion: number
  onConnect: () => void
  onEdit: (connection: ConnectionRecord) => void
}

/** "1 connection", "2 connections": pluralized counts, never "connection(s)". */
export function formatCount(count: number, noun: string): string {
  return count === 1 ? `1 ${noun}` : `${count} ${noun}s`
}

function stateBadgeClass(state: ValidationState): string {
  if (state === "valid") {
    return "badge badge-success"
  }
  if (state === "invalid") {
    return "badge badge-error"
  }
  return "badge badge-neutral"
}

function formatLastChecked(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return "Not checked yet."
  }
  const formatted = date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
  return `Last checked ${formatted}.`
}

/** Render the dashboard shell with the connection list. */
export function Dashboard({ dataVersion, onConnect, onEdit }: DashboardProps) {
  const [connections, setConnections] = useState<ConnectionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [busyChecking, setBusyChecking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingDisconnect, setPendingDisconnect] =
    useState<ConnectionRecord | null>(null)

  const load = useCallback(async function loadConnections() {
    setLoading(true)
    setLoadError(null)
    try {
      setConnections(await listConnections())
    } catch {
      setLoadError(
        "Connections could not be loaded. Close and reopen the plugin, then try again."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(
    function loadOnMountAndRefresh() {
      void load()
    },
    [load, dataVersion]
  )

  async function handleSetActive(connection: ConnectionRecord) {
    setBusyId(connection.id)
    setActionError(null)
    try {
      await setActiveConnection(connection.id)
      await load()
    } catch {
      setActionError("The active connection could not be changed. Try again.")
    } finally {
      setBusyId(null)
    }
  }

  async function handleRevalidate(connection: ConnectionRecord) {
    setBusyId(connection.id)
    setBusyChecking(true)
    setActionError(null)
    try {
      await revalidateConnection(connection.id)
      await load()
    } catch (error) {
      setActionError(formatErrorSentence(error))
      await load()
    } finally {
      setBusyChecking(false)
      setBusyId(null)
    }
  }

  async function handleDisconnect() {
    const target = pendingDisconnect
    if (!target) {
      return
    }
    setBusyId(target.id)
    setActionError(null)
    try {
      await deleteConnection(target.id)
      setPendingDisconnect(null)
      await load()
    } catch {
      setActionError("The connection could not be removed. Try again.")
    } finally {
      setBusyId(null)
    }
  }

  function renderConnection(connection: ConnectionRecord) {
    const busy = busyId === connection.id
    return (
      <li
        key={connection.id}
        className={
          connection.isActive
            ? "connection-row connection-row-active"
            : "connection-row"
        }
      >
        <div className="connection-main">
          <div className="connection-title-row">
            <span className="connection-host">{connection.storeHost}</span>
            {connection.isActive ? (
              <span className="badge badge-primary">Active</span>
            ) : null}
          </div>
          <div className="badge-row">
            <span className={stateBadgeClass(connection.validationState)}>
              {CONNECTION_STATE_LABELS[connection.validationState]}
            </span>
            <span className="badge badge-neutral">
              {KEY_SCOPE_LABELS[connection.keyScope]}
            </span>
          </div>
          <p className="muted small">
            {connection.lastValidatedAt
              ? formatLastChecked(connection.lastValidatedAt)
              : "Not checked yet."}
          </p>
        </div>
        <div className="connection-actions">
          {!connection.isActive ? (
            <button
              type="button"
              className="btn btn-ghost btn-small"
              disabled={busy}
              onClick={function handleClick() {
                void handleSetActive(connection)
              }}
            >
              Set active
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-ghost btn-small"
            disabled={busy}
            onClick={function handleClick() {
              void handleRevalidate(connection)
            }}
          >
            {busy && busyChecking ? "Checking\u2026" : "Revalidate"}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            disabled={busy}
            onClick={function handleClick() {
              onEdit(connection)
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-ghost-danger btn-small"
            disabled={busy}
            onClick={function handleClick() {
              setPendingDisconnect(connection)
            }}
          >
            Disconnect
          </button>
        </div>
      </li>
    )
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Ecom-Link</h1>
        <HelpTooltip text="Connect a WooCommerce store and sync its products into Framer CMS collections." />
      </header>

      {loadError ? (
        <div className="notice notice-error" role="alert">
          <p>{loadError}</p>
        </div>
      ) : null}
      {actionError ? (
        <div className="notice notice-error" role="alert">
          <p>{actionError}</p>
        </div>
      ) : null}

      {loading ? (
        <p className="muted">Loading connections.</p>
      ) : connections.length === 0 ? (
        <section className="card empty-card">
          <h2 className="card-title">No Store Connected Yet</h2>
          <p className="muted">
            Connect your WooCommerce store to start syncing products.
          </p>
          <button type="button" className="btn btn-primary" onClick={onConnect}>
            Connect store
          </button>
        </section>
      ) : (
        <section className="card">
          <div className="card-heading-row">
            <h2 className="card-title">Store Connections</h2>
            <span className="muted small">
              {formatCount(connections.length, "connection")}
            </span>
          </div>
          <ul className="connection-list">{connections.map(renderConnection)}</ul>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={onConnect}
          >
            Connect another store
          </button>
        </section>
      )}

      {pendingDisconnect ? (
        <Modal
          title="Disconnect Store?"
          onClose={function handleClose() {
            setPendingDisconnect(null)
          }}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busyId !== null}
                onClick={function handleClose() {
                  setPendingDisconnect(null)
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={busyId !== null}
                onClick={function handleConfirm() {
                  void handleDisconnect()
                }}
              >
                Disconnect
              </button>
            </>
          }
        >
          <p>
            This removes the stored keys for {pendingDisconnect.storeHost}.
            Products already synced stay in your CMS collection. Syncing stops
            until you connect again.
          </p>
        </Modal>
      ) : null}
    </main>
  )
}
