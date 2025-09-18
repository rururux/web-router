import { defineProject } from "vitest/config";
import react from "@vitejs/plugin-react";
import * as path from "node:path"

export default defineProject({
  resolve: {
    alias: [
      {
        find: /^wouter$/,
        replacement: path.resolve(__dirname, "./src/index.js")
      },
      {
        find: /^wouter\/(.*)/,
        replacement: path.resolve(__dirname, "./src/$1.js")
      }
    ]
  },
  plugins: [react({ jsxRuntime: "automatic" })],
  test: {
    name: "wouter-react",
    browser: {
      provider: "playwright",
      enabled: true,
      instances: [
        { browser: "chromium" },
      ],
    }
  },
});
