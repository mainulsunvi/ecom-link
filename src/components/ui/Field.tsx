/**
 * Field: labeled form input with help text and error display.
 *
 * helpText is limited to one short sentence by convention (INSTRUCTION.md
 * section 7, rule 3); longer explanations belong in HelpTooltip next to the
 * relevant heading. Errors are full actionable sentences shown with
 * role="alert" so screen readers announce them.
 */

interface FieldProps {
  /** DOM id, also used to derive the help and error ids. */
  id: string
  /** Field label in sentence case, e.g. "Store URL". */
  label: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "password" | "url"
  placeholder?: string
  /** One short sentence. Keep it to a single sentence. */
  helpText?: string
  /** Full sentence describing what to fix. */
  error?: string
  disabled?: boolean
  autoComplete?: string
}

/** Render a labeled input wired for accessible help and error reporting. */
export function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  helpText,
  error,
  disabled = false,
  autoComplete,
}: FieldProps) {
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  const describedBy =
    [helpText ? helpId : null, error ? errorId : null]
      .filter(function hasValue(part) {
        return part !== null
      })
      .join(" ") || undefined

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value)
  }

  return (
    <div className={error ? "field field-invalid" : "field"}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="field-input"
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {helpText ? (
        <p className="field-help" id={helpId}>
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p className="field-error-text" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
