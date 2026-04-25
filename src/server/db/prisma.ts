declare global {
  var prisma: import("@prisma/client").PrismaClient | undefined;
}

function isEdgeRuntime() {
  return (
    typeof globalThis !== "undefined" &&
    (globalThis as Record<string, unknown>).EdgeRuntime !== undefined
  ) || (
    typeof process !== "undefined" &&
    process.env.CF_PAGES === "1"
  );
}

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/cetelts";

  const { PrismaPg } = require("@prisma/adapter-pg") as { PrismaPg: new (opts: { connectionString: string }) => unknown };
  const { PrismaClient } = require("@prisma/client") as { PrismaClient: new (opts: { adapter: unknown }) => import("@prisma/client").PrismaClient };
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrismaClient() {
  if (isEdgeRuntime()) {
    throw new Error("DATABASE_UNAVAILABLE");
  }

  if (!globalThis.prisma) {
    try {
      globalThis.prisma = createPrismaClient();
    } catch {
      throw new Error("DATABASE_UNAVAILABLE");
    }
  }

  return globalThis.prisma;
}

export const prisma = new Proxy({} as import("@prisma/client").PrismaClient, {
  get(_target, prop: string) {
    if (prop === "$$typeof") return undefined;
    if (prop === "then") return undefined;
    const client = getPrismaClient();
    const value = (client as unknown as Record<string, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  try {
    if (!globalThis.prisma && !isEdgeRuntime()) {
      globalThis.prisma = createPrismaClient();
    }
  } catch {}
}
