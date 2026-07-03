import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", ".opencode"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
