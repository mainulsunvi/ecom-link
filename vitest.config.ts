import { defineConfig } from "vitest/config"

// Standalone config so tests never pick up the Framer Vite plugins.
// Component tests opt into jsdom with a @vitest-environment docblock.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
