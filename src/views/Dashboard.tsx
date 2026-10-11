/**
 * Dashboard: the plugin home (spec 002 shell; spec 007 completes it).
 *
 * Shows the connection list with the active connection, per-connection
 * actions, and the empty state. All data flows through the storage layer;
 * no platform calls happen here.
 */

import { useCallback, useEffect, useState } from "react"

import dashboardStyles from "../assets/styles/module/Dashboard.module.css"
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

/** "1 connection", "2 connections": pluralized counts, never lazy plural forms. */
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

/** Icon tile class: green when connected, red when failed, neutral otherwise. */
function connectionIconClass(state: ValidationState): string {
  if (state === "valid") {
    return `${dashboardStyles.connectionIcon} ${dashboardStyles.iconSuccess}`
  }
  if (state === "invalid") {
    return `${dashboardStyles.connectionIcon} ${dashboardStyles.iconDanger}`
  }
  return `${dashboardStyles.connectionIcon} ${dashboardStyles.iconNeutral}`
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

/** Header brand mark: circling arrows for the sync motif. */
function SyncMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M23 4v6h-6" />
        <path d="M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
        <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </g>
    </svg>
  )
}

/** Row mark: a globe tinted by the connection state class around it. */
function GlobeMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a13.5 13.5 0 0 1 3.6 9 13.5 13.5 0 0 1-3.6 9 13.5 13.5 0 0 1-3.6-9A13.5 13.5 0 0 1 12 3z" />
      </g>
    </svg>
  )
}

/** Empty state mark: a shopping bag inviting the first connection. */
function BagMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </g>
    </svg>
  )
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
            ? `${dashboardStyles.connectionRow} ${dashboardStyles.connectionRowActive}`
            : dashboardStyles.connectionRow
        }
      >
        <div className={dashboardStyles.connectionTop}>
          <span
            className={connectionIconClass(connection.validationState)}
            aria-hidden="true"
          >
            <GlobeMark />
          </span>
          <div className={dashboardStyles.connectionMain}>
            <div className={dashboardStyles.connectionTitleRow}>
              <span className={dashboardStyles.connectionHost}>{connection.storeHost}</span>
              {connection.isActive ? (
                <span className="badge badge-primary">
                  <span className="badge-dot" aria-hidden="true" />
                  Active
                </span>
              ) : null}
            </div>
            <div className={dashboardStyles.badgeRow}>
              <span className={stateBadgeClass(connection.validationState)}>
                <span className="badge-dot" aria-hidden="true" />
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
        </div>
        <div className={dashboardStyles.connectionActions}>
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
      <main className={dashboardStyles.dashboard}>
          <header className={dashboardStyles.dashboardHeader}>
              <div className={dashboardStyles.headerBrand}>
                  <span
                      className={dashboardStyles.headerLogo}
                      aria-hidden='true'>
                      <SyncMark />
                  </span>
                  <div className={dashboardStyles.headerText}>
                      <h1 className={dashboardStyles.dashboardTitle}>
                          Ecom-Link
                      </h1>
                      <p className={dashboardStyles.dashboardSubtitle}>
                          Sync your store with Framer.
                      </p>
                  </div>
              </div>
              <HelpTooltip text='Connect a WooCommerce store and sync its products into Framer CMS collections.' />
          </header>

          <div className={dashboardStyles.dashboardContent}>
              {loadError ? (
                  <div
                      className='notice notice-error'
                      role='alert'>
                      <p>{loadError}</p>
                  </div>
              ) : null}
              {actionError ? (
                  <div
                      className='notice notice-error'
                      role='alert'>
                      <p>{actionError}</p>
                  </div>
              ) : null}

              {loading ? (
                  <div className={dashboardStyles.loadingRow}>
                      <span
                          className={dashboardStyles.spinner}
                          aria-hidden='true'
                      />
                      <span>Loading connections.</span>
                  </div>
              ) : connections.length === 0 ? (
                  <section
                      className={`${dashboardStyles.card} ${dashboardStyles.emptyCard}`}>
                      <span
                          className={dashboardStyles.emptyIconWrap}
                          aria-hidden='true'>
                          <BagMark />
                      </span>
                      <h2 className={dashboardStyles.cardTitle}>
                          No Store Connected Yet
                      </h2>
                      <p className='muted'>
                          Connect your WooCommerce store to start syncing
                          products.
                      </p>
                      <button
                          type='button'
                          className='btn btn-primary btn-lg btn-block'
                          onClick={onConnect}>
                          Connect store
                      </button>
                  </section>
              ) : (
                  <section className={dashboardStyles.card}>
                      <div className={dashboardStyles.cardHeadingRow}>
                          <h2 className={dashboardStyles.cardTitle}>
                              Store Connections
                          </h2>
                          <span className='muted small'>
                              {formatCount(connections.length, 'connection')}
                          </span>
                      </div>
                      <ul className={dashboardStyles.connectionList}>
                          {connections.map(renderConnection)}
                      </ul>
                      <button
                          type='button'
                          className='btn btn-secondary btn-block'
                          onClick={onConnect}>
                          Connect another store
                      </button>
                  </section>
              )}

              {pendingDisconnect ? (
                  <Modal
                      title='Disconnect Store?'
                      onClose={function handleClose() {
                          setPendingDisconnect(null);
                      }}
                      footer={
                          <>
                              <button
                                  type='button'
                                  className='btn btn-secondary'
                                  disabled={busyId !== null}
                                  onClick={function handleClose() {
                                      setPendingDisconnect(null);
                                  }}>
                                  Cancel
                              </button>
                              <button
                                  type='button'
                                  className='btn btn-danger'
                                  disabled={busyId !== null}
                                  onClick={function handleConfirm() {
                                      void handleDisconnect();
                                  }}>
                                  Disconnect
                              </button>
                          </>
                      }>
                      <p>
                          This removes the stored keys for{' '}
                          {pendingDisconnect.storeHost}. Products already synced
                          stay in your CMS collection. Syncing stops until you
                          connect again.
                      </p>
                  </Modal>
              ) : null}
          </div>
      </main>
  );
}
