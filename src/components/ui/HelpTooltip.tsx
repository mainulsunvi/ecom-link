/**
 * HelpTooltip: shared info icon plus tooltip (INSTRUCTION.md section 7, rule 3).
 *
 * Field-level help stays as one short sentence in helpText. Anything longer
 * rides this component next to the heading or row it explains.
 */

import { useState } from "react"

interface HelpTooltipProps {
  /** The explanation. One to three sentences, ending with a period. */
  text: string
  /** Accessible name for the info button. Defaults to a generic label. */
  label?: string
}

/**
 * Render an info icon that shows a tooltip on hover and on keyboard focus,
 * so the same help reaches mouse and keyboard users.
 */
export function HelpTooltip({ text, label = "More information" }: HelpTooltipProps) {
  const [open, setOpen] = useState(false)

  function show() {
    setOpen(true)
  }

  function hide() {
    setOpen(false)
  }

  return (
    <span className="help-tooltip">
      <button
        type="button"
        className="icon-button help-tooltip-button"
        aria-label={label}
        aria-expanded={open}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="7.25" y="7" width="1.5" height="4.5" rx="0.75" fill="currentColor" />
          <circle cx="8" cy="4.6" r="1" fill="currentColor" />
        </svg>
      </button>
      {open ? (
        <span className="help-tooltip-bubble" role="tooltip">
          {text}
        </span>
      ) : null}
    </span>
  )
}
