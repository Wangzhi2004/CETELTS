import { defineConfig } from "@prisma/config";

export default defineConfig({
  migrate: {
    datasourceUrl: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/cetelts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/cetelts",
  },
});