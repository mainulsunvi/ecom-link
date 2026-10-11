import { defineConfig } from "vitest/config"

// Standalone config so tests never pick up the Framer Vite plugins.
// Component tests opt into jsdom with a @vitest-environment docblock.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // Spec 001 AC3 is a compile-time criterion. Type-level tests live in
    // files ending in .test-d.ts and run tsc as part of every test run.
    typecheck: {
      enabled: true,
    },
  },
})
