// @vitest-environment jsdom
/**
 * ConnectionPage Card integration: the Store Details section must render
 * inside the Polaris-style Card shell, keeping the labeled input accessible.
 */

import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"

// The real @framer/plugin module never resolves outside the Framer host,
// so render tests must mock it before importing views that reach storage.
vi.mock("@framer/plugin", () => ({ framer: {} }))

import { ConnectionPage } from "../ConnectionPage"
import cardStyles from "../../assets/styles/module/Card.module.css"

afterEach(function cleanupDom() {
  cleanup()
})

describe("ConnectionPage Card", () => {
  it("renders Store Details inside the Card shell", () => {
    const { container } = render(
      <ConnectionPage
        connection={null}
        onBack={function noop() {}}
        onSaved={function noop() {}}
      />
    )
    const card = container.querySelector(`section.${cardStyles.uiCard}`)
    expect(card).not.toBeNull()
    const heading = screen.getByText("Store Details")
    expect(card?.contains(heading)).toBe(true)
    const input = card?.querySelector("input#storeUrl")
    expect(input).not.toBeNull()
  })
})
