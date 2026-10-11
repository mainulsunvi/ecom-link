/**
 * Dashboard: the plugin home (spec 002 shell; spec 007 completes it).
 *
 * Shows the connection list with the active connection, per-connection
 * actions, and the empty state. All data flows through the storage layer;
 * no platform calls happen here.
 */

import { useCallback, useEffect, useState } from "react"
import { RefreshCw, Globe, ShoppingBag, Store, Package, Book, MessageCircle, Lightbulb } from "lucide-react"

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
  return <RefreshCw size={16} aria-hidden="true" />
}

/** Row mark: a globe tinted by the connection state class around it. */
function GlobeMark() {
  return <Globe size={18} aria-hidden="true" />
}

/** Get the appropriate icon for each connection type. */
function getConnectionTypeIcon(id: string, size: number = 24) {
  switch (id) {
    case "woocommerce":
      return <ShoppingBag size={size} aria-hidden="true" />
    case "shopify":
      return <Store size={size} aria-hidden="true" />
    case "bigcommerce":
      return <Package size={size} aria-hidden="true" />
    default:
      return <Globe size={size} aria-hidden="true" />
  }
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

  /** Available connection types with their status. */
  const connectionTypes = [
    {
      id: "woocommerce",
      name: "WooCommerce",
      description: "",
      available: true,
    },
    {
      id: "shopify",
      name: "Shopify",
      description: "",
      available: false,
    },
    {
      id: "bigcommerce",
      name: "BigCommerce",
      description: "",
      available: false,
    },
    {
      id: "Wix-Commerce",
      name: "Wix Commerce",
      description: "",
      available: false,
    },
  ]

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

              {/* Section 1: Connection Types */}
              <section className={dashboardStyles.section}>
                  <h2 className={dashboardStyles.sectionTitle}>Connection Types</h2>
                  <div className={dashboardStyles.connectionTypes}>
                      {connectionTypes.map((type) => (
                          <div
                              key={type.id}
                              className={`${dashboardStyles.connectionTypeCard} ${
                                  !type.available ? dashboardStyles.connectionTypeDisabled : ""
                              }`}
                          >
                              <span
                                  className={dashboardStyles.connectionTypeIcon}
                                  aria-hidden='true'
                              >
                                  {getConnectionTypeIcon(type.id)}
                              </span>
                              <div className={dashboardStyles.connectionTypeInfo}>
                                  <div className={dashboardStyles.connectionTypeHeader}>
                                      <h3 className={dashboardStyles.connectionTypeName}>
                                          {type.name}
                                      </h3>
                                      {!type.available && (
                                          <span className={dashboardStyles.badge}>Coming Soon</span>
                                      )}
                                  </div>
                                  <p className={dashboardStyles.connectionTypeDescription}>
                                      {type.description}
                                  </p>
                              </div>
                              {type.available && (
                                  <button
                                      type='button'
                                      className='btn btn-primary btn-small'
                                      onClick={onConnect}
                                  >
                                      Connect
                                  </button>
                              )}
                          </div>
                      ))}
                  </div>
              </section>

              {/* Section 2: Support */}
              <section className={dashboardStyles.section}>
                  <h2 className={dashboardStyles.sectionTitle}>Support</h2>
                  <div className={dashboardStyles.supportLinks}>
                      <a
                          href='https://docs.example.com'
                          target='_blank'
                          rel='noopener noreferrer'
                          className={dashboardStyles.supportLink}
                      >
                          <span className={dashboardStyles.supportIcon}><Book size={18} /></span>
                          <span>Documentation</span>
                      </a>
                      <a
                          href='https://support.example.com'
                          target='_blank'
                          rel='noopener noreferrer'
                          className={dashboardStyles.supportLink}
                      >
                          <span className={dashboardStyles.supportIcon}><MessageCircle size={18} /></span>
                          <span>Get Help</span>
                      </a>
                      <a
                          href='https://feedback.example.com'
                          target='_blank'
                          rel='noopener noreferrer'
                          className={dashboardStyles.supportLink}
                      >
                          <span className={dashboardStyles.supportIcon}><Lightbulb size={18} /></span>
                          <span>Send Feedback</span>
                      </a>
                  </div>
              </section>

              {/* Section 3: Other Apps */}
              <section className={dashboardStyles.section}>
                  <h2 className={dashboardStyles.sectionTitle}>Other Apps</h2>
                  <div className={dashboardStyles.otherApps}>
                      <div className={dashboardStyles.appCard}>
                          <h3 className={dashboardStyles.appName}>App One</h3>
                          <p className={dashboardStyles.appDescription}>
                              Description of the first app.
                          </p>
                          <a
                              href='https://app1.example.com'
                              target='_blank'
                              rel='noopener noreferrer'
                              className='btn btn-secondary btn-small'
                          >
                              Learn More
                          </a>
                      </div>
                      <div className={dashboardStyles.appCard}>
                          <h3 className={dashboardStyles.appName}>App Two</h3>
                          <p className={dashboardStyles.appDescription}>
                              Description of the second app.
                          </p>
                          <a
                              href='https://app2.example.com'
                              target='_blank'
                              rel='noopener noreferrer'
                              className='btn btn-secondary btn-small'
                          >
                              Learn More
                          </a>
                      </div>
                  </div>
              </section>

              {/* Existing connections list (if any) */}
              {loading ? (
                  <div className={dashboardStyles.loadingRow}>
                      <span
                          className={dashboardStyles.spinner}
                          aria-hidden='true'
                      />
                      <span>Loading connections.</span>
                  </div>
              ) : connections.length > 0 ? (
                  <section className={dashboardStyles.card}>
                      <div className={dashboardStyles.cardHeadingRow}>
                          <h2 className={dashboardStyles.cardTitle}>
                              Your Connections
                          </h2>
                          <span className='muted small'>
                              {formatCount(connections.length, 'connection')}
                          </span>
                      </div>
                      <ul className={dashboardStyles.connectionList}>
                          {connections.map(renderConnection)}
                      </ul>
                  </section>
              ) : null}

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
