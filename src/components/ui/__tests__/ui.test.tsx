// @vitest-environment jsdom
/**
 * Component tests for the reusable UI pieces: the Switch paddle (the only
 * boolean toggle allowed), the Modal shell, the Field input, and the
 * Polaris-style Card.
 */

import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { Switch } from "../Switch"
import { Modal } from "../Modal"
import { Field } from "../Field"
import { Card } from "../Card"
import cardStyles from "../../../assets/styles/module/Card.module.css"

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
    const toggle = screen.getByRole("switch", {
      name: "Two-way sync",
    }) as HTMLInputElement
    expect(toggle.checked).toBe(false)
    fireEvent.click(toggle)
    expect(next).toBe(true)
  })

  it("renders a visible sentence-case label when given one", () => {
    render(
      <Switch checked={true} onChange={function noop() {}} label="Two-way sync" />
    )
    const toggle = screen.getByRole("switch", {
      name: "Two-way sync",
    }) as HTMLInputElement
    expect(toggle.checked).toBe(true)
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

describe("Card", () => {
  it("renders the compound header, sections, and footer", () => {
    render(
      <Card>
        <Card.Header
          title="Store Connections"
          actions={<button type="button">Add store</button>}
        />
        <Card.Section title="Sync Settings">
          <p>Products sync every hour.</p>
        </Card.Section>
        <Card.Section>Connection details.</Card.Section>
        <Card.Footer actions={<button type="button">Save changes</button>}>
          Changes apply immediately.
        </Card.Footer>
      </Card>
    )
    expect(
      screen.getByRole("heading", { level: 2, name: "Store Connections" })
    ).toBeDefined()
    expect(
      screen.getByRole("heading", { level: 3, name: "Sync Settings" })
    ).toBeDefined()
    expect(screen.getByText("Products sync every hour.")).toBeDefined()
    expect(screen.getByRole("button", { name: "Add store" })).toBeDefined()
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDefined()
    expect(screen.getByText("Changes apply immediately.")).toBeDefined()
  })

  it("renders a header from the convenience title and actions props", () => {
    render(
      <Card title="Store Connection" actions={<button type="button">Edit</button>}>
        <Card.Section>Content.</Card.Section>
      </Card>
    )
    expect(
      screen.getByRole("heading", { level: 2, name: "Store Connection" })
    ).toBeDefined()
    expect(screen.getByRole("button", { name: "Edit" })).toBeDefined()
  })

  it("renders a subheading under the root title", () => {
    render(
      <Card
        title="Store Connection"
        subheading="Connect your WooCommerce store."
      >
        <Card.Section>Content.</Card.Section>
      </Card>
    )
    expect(
      screen.getByRole("heading", { level: 2, name: "Store Connection" })
    ).toBeDefined()
    expect(
      screen.getByText("Connect your WooCommerce store.")
    ).toBeDefined()
  })

  it("renders a section subheading under the section title", () => {
    render(
      <Card>
        <Card.Section
          title="Store Details"
          subheading="Where your WooCommerce store lives."
        >
          <p>Content.</p>
        </Card.Section>
      </Card>
    )
    expect(
      screen.getByRole("heading", { level: 3, name: "Store Details" })
    ).toBeDefined()
    expect(
      screen.getByText("Where your WooCommerce store lives.")
    ).toBeDefined()
  })

  it("maps the background tone to a modifier class", () => {
    const { container } = render(
      <Card background="secondary">
        <Card.Section>Content.</Card.Section>
      </Card>
    )
    expect(
      container.querySelector("." + cardStyles.uiCard)?.className
    ).toContain(cardStyles.bgSecondary)
  })

  it("renders subsections inside a section", () => {
    render(
      <Card title="Store Connection">
        <Card.Section title="Sync Settings">
          <Card.Subsection>Products</Card.Subsection>
          <Card.Subsection>Orders</Card.Subsection>
        </Card.Section>
      </Card>
    )
    expect(screen.getByText("Products")).toBeDefined()
    expect(screen.getByText("Orders")).toBeDefined()
  })
})
