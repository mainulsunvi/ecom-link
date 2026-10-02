// @vitest-environment jsdom
/**
 * Component tests for the reusable UI pieces: the Switch paddle (the only
 * boolean toggle allowed), the Modal shell, and the Field input.
 */

import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { Switch } from "../Switch"
import { Modal } from "../Modal"
import { Field } from "../Field"

afterEach(function cleanupDom() {
  cleanup()
})

describe("Switch", () => {
  it("exposes a switch role and reports toggles", () => {
    let next: boolean | null = null
    function handleChange(value: boolean) {
      next = value
    }
    render(
      <Switch checked={false} onChange={handleChange} ariaLabel="Two-way sync" />
    )
    const toggle = screen.getByRole("switch", { name: "Two-way sync" })
    expect(toggle.getAttribute("aria-checked")).toBe("false")
    fireEvent.click(toggle)
    expect(next).toBe(true)
  })

  it("renders a visible sentence-case label when given one", () => {
    render(
      <Switch checked={true} onChange={function noop() {}} label="Two-way sync" />
    )
    const toggle = screen.getByRole("switch", { name: "Two-way sync" })
    expect(toggle.getAttribute("aria-checked")).toBe("true")
    expect(screen.getByText("Two-way sync")).toBeDefined()
  })
})

describe("Modal", () => {
  it("renders a Title Case titled dialog and closes on Escape", () => {
    const onClose = vi.fn()
    render(
      <Modal title="Connect Store" onClose={onClose}>
        <p>Body text.</p>
      </Modal>
    )
    expect(screen.getByRole("dialog")).toBeDefined()
    expect(screen.getByText("Connect Store")).toBeDefined()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe("Field", () => {
  it("links label, help text, and error to the input", () => {
    render(
      <Field
        id="demo"
        label="Store URL"
        value=""
        onChange={function noop() {}}
        helpText="The address of your WooCommerce store."
        error="Store addresses must use HTTPS."
      />
    )
    const input = screen.getByLabelText("Store URL")
    const describedBy = input.getAttribute("aria-describedby") ?? ""
    expect(describedBy).toContain("demo-help")
    expect(describedBy).toContain("demo-error")
    expect(screen.getByRole("alert").textContent).toBe(
      "Store addresses must use HTTPS."
    )
  })
})
