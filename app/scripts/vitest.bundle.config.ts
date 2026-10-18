import { defineConfig } from "vitest/config";

// 通常のテストはdist不要。こちらはproductionビルド後に必ず実行する。
export default defineConfig({
  test: { environment: "node", include: ["scripts/web-bundle.test.ts"] },
});
