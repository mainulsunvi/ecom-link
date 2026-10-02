/**
 * App: plugin shell. Owns which modal is open and refreshes the dashboard
 * after saves (architecture: App owns modal router state; no routes in MVP).
 */

import { useState } from "react"
import { framer } from "@framer/plugin"
import "./App.css"
import { Dashboard } from "./views/Dashboard"
import { ConnectionModal } from "./views/ConnectionModal"
import type { ConnectionRecord } from "./storage/connections"

framer.showUI({
  position: "top right",
  width: 340,
  height: 540,
})

/** Which modal is open, if any. Modals only; no routes in the MVP. */
type ModalState =
  | { mode: "add" }
  | { mode: "edit"; connection: ConnectionRecord }
  | null

export function App() {
  const [modal, setModal] = useState<ModalState>(null)
  const [dataVersion, setDataVersion] = useState(0)

  function handleOpenAdd() {
    setModal({ mode: "add" })
  }

  function handleOpenEdit(connection: ConnectionRecord) {
    setModal({ mode: "edit", connection })
  }

  function handleCloseModal() {
    setModal(null)
  }

  function handleSaved() {
    setDataVersion(function bump(version) {
      return version + 1
    })
  }

  return (
    <>
      <Dashboard
        dataVersion={dataVersion}
        onConnect={handleOpenAdd}
        onEdit={handleOpenEdit}
      />
      {modal ? (
        modal.mode === "add" ? (
          <ConnectionModal
            connection={null}
            onClose={handleCloseModal}
            onSaved={handleSaved}
          />
        ) : (
          <ConnectionModal
            connection={modal.connection}
            onClose={handleCloseModal}
            onSaved={handleSaved}
          />
        )
      ) : null}
    </>
  )
}
