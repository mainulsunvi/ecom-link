/**
 * Switch: the one and only boolean toggle (INSTRUCTION.md section 6).
 *
 * Every boolean setting in the plugin uses this component. Checkboxes,
 * SettingToggle-style widgets, and button-based toggles are banned by the
 * user directive from 2026-09-06.
 */

import type { ReactNode } from "react"

interface SwitchProps {
  /** Current on/off state. */
  checked: boolean
  /** Called with the next state whenever the user toggles. */
  onChange: (next: boolean) => void
  /** Optional visible label, sentence case, rendered next to the paddle. */
  label?: string
  /** Accessible name when no visible label is rendered. */
  ariaLabel?: string
  disabled?: boolean
}

/**
 * Render an accessible paddle switch. The native button element provides
 * keyboard support (Enter and Space) and focus behavior for free.
 */
export function Switch({
  checked,
  onChange,
  label,
  ariaLabel,
  disabled = false,
}: SwitchProps) {
  const control: ReactNode = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ?? ariaLabel}
      className="switch"
      disabled={disabled}
      onClick={function handleClick() {
        onChange(!checked)
      }}
    >
      <span className="switch-track">
        <span className="switch-thumb" />
      </span>
    </button>
  )
  if (!label) {
    return control
  }
  return (
    <span className="switch-row">
      {control}
      <span className="switch-label">{label}</span>
    </span>
  )
}
