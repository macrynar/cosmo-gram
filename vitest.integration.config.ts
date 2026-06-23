import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Testy integracyjne (uderzają w prawdziwe Supabase) — osobno od `vitest run`,
// żeby domyślny przebieg jednostkowy zostawał zielony i offline.
// Uruchom: RUN_RLS_TESTS=true npm run test:rls
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.test.ts"],
  },
});
