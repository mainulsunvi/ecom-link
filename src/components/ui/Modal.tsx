/**
 * Modal: reusable modal shell (INSTRUCTION.md section 6, modals over routes).
 *
 * Titles arrive in Title Case from the caller (section 7, rule 1). Closes on
 * the Escape key and on overlay clicks, but never on clicks inside the panel.
 */

import { useEffect } from "react"
import type { ReactNode } from "react"

interface ModalProps {
  /** Modal title in Title Case, e.g. "Connect Store". */
  title: string
  /** Called when the user closes the modal without a primary action. */
  onClose: () => void
  children: ReactNode
  /** Optional footer row, typically the action buttons. */
  footer?: ReactNode
}

/**
 * Render a centered modal with a header, body, and optional footer above a
 * dimmed overlay.
 */
export function Modal({ title, onClose, children, footer }: ModalProps) {
  useEffect(
    function bindEscapeKey() {
      function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
          onClose()
        }
      }
      document.addEventListener("keydown", handleKeyDown)
      return function unbind() {
        document.removeEventListener("keydown", handleKeyDown)
      }
    },
    [onClose]
  )

  function handleOverlayMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    // Only a direct click on the overlay itself closes; clicks inside the
    // panel must never discard form input.
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayMouseDown}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close"
            onClick={onClose}
          >
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M4 4l8 8M12 4l-8 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </div>
    </div>
  )
}
