/**
 * App: plugin shell. Manages page-based navigation between dashboard and
 * connection forms (architecture: App owns page router state).
 */

import { useState } from "react"
import { framer } from "./lib/framer"
import "./App.css"
import { Dashboard } from "./views/Dashboard"
import { ConnectionPage } from "./views/ConnectionPage"
import type { ConnectionRecord } from "./storage/connections"

/** Current page view. */
type PageState =
  | { view: "dashboard" }
  | { view: "add" }
  | { view: "edit"; connection: ConnectionRecord }

/**
 * Standalone browser preview: when the page is opened with a ?view= query
 * (e.g. /?view=add), the plugin runs outside the Framer canvas. Skip the
 * bridge entirely and boot straight into that page so the UI can be
 * previewed in a plain browser tab at localhost:5174.
 */
function getPreviewView(): PageState | null {
  if (typeof window === "undefined") {
    return null
  }
  const view = new URLSearchParams(window.location.search).get("view")
  if (view === "add") {
    return { view: "add" }
  }
  return null
}

const previewView = getPreviewView()

if (!previewView) {
  framer.showUI({
    position: "top right",
    width: 340,
    minHeight: 440,
    resizable: "height",
  })
}

export function App() {
  const [page, setPage] = useState<PageState>(
    previewView ?? { view: "dashboard" }
  )
  const [dataVersion, setDataVersion] = useState(0)

  function handleOpenAdd() {
    setPage({ view: "add" })
  }

  function handleOpenEdit(connection: ConnectionRecord) {
    setPage({ view: "edit", connection })
  }

  function handleBack() {
    setPage({ view: "dashboard" })
  }

  function handleSaved() {
    setDataVersion(function bump(version) {
      return version + 1
    })
    setPage({ view: "dashboard" })
  }

  if (page.view === "add") {
    return (
      <ConnectionPage
        connection={null}
        onBack={handleBack}
        onSaved={handleSaved}
      />
    )
  }

  if (page.view === "edit") {
    return (
      <ConnectionPage
        connection={page.connection}
        onBack={handleBack}
        onSaved={handleSaved}
      />
    )
  }

  return (
    <Dashboard
      dataVersion={dataVersion}
      onConnect={handleOpenAdd}
      onEdit={handleOpenEdit}
    />
  )
}
