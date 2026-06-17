import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "~/config": path.resolve(__dirname, "./config"),
      "~/components": path.resolve(__dirname, "./components"),
      "~/lib": path.resolve(__dirname, "./lib"),
      "~": path.resolve(__dirname, "./app"),
    },
  },
});
