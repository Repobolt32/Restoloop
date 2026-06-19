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
    alias: [
      { find: "~/lib", replacement: path.resolve(__dirname, "./lib") },
      { find: "~/config", replacement: path.resolve(__dirname, "./config") },
      { find: "~/components", replacement: path.resolve(__dirname, "./components") },
      { find: "~", replacement: path.resolve(__dirname, "./app") },
    ],
  },
});
