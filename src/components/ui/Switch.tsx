/**
 * Switch: the one and only boolean toggle (INSTRUCTION.md section 6).
 *
 * Every boolean setting in the plugin uses this component. Bare checkboxes,
 * SettingToggle-style widgets, and hand-rolled button toggles are banned by
 * the user directive from 2026-09-06. The Switch itself is a native
 * checkbox input upgraded with switch semantics.
 */

import type { ReactNode } from "react"

import switchStyles from "../../assets/styles/module/Switch.module.css"

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
 * Render an accessible paddle switch built on a native checkbox input.
 * `role="switch"` upgrades the input to on/off semantics while keeping
 * native keyboard support (Space), focus, checked, and disabled behavior
 * for free. The track and thumb are decorative siblings of the visually
 * hidden input, styled via `.switchInput:checked + .switchTrack` in
 * Switch.module.css.
 */
export function Switch({
  checked,
  onChange,
  label,
  ariaLabel,
  disabled = false,
}: SwitchProps) {
  const control: ReactNode = (
    <span className={switchStyles.switch}>
      <input
        type="checkbox"
        role="switch"
        className={switchStyles.switchInput}
        checked={checked}
        disabled={disabled}
        aria-label={label ?? ariaLabel}
        onChange={function handleChange(event) {
          onChange(event.currentTarget.checked)
        }}
      />
      <span className={switchStyles.switchTrack} aria-hidden="true">
        <span className={switchStyles.switchThumb} />
      </span>
    </span>
  )
  if (!label) {
    return control
  }
  return (
    <label className={switchStyles.switchRow}>
      {control}
      <span className={switchStyles.switchLabel}>{label}</span>
    </label>
  )
}
