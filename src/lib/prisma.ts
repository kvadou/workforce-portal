import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Configure SSL for production Postgres (required in production)
  // Production may require sslmode=no-verify to work with self-signed certs
  const connectionString = process.env.DATABASE_URL || "";
  const isRemoteDb = !connectionString.includes("@localhost") && !connectionString.includes("@127.0.0.1");
  const isProduction = process.env.NODE_ENV === "production";

  // Append sslmode=no-verify for remote databases
  const finalConnectionString = isRemoteDb && !connectionString.includes("sslmode=")
    ? `${connectionString}${connectionString.includes("?") ? "&" : "?"}sslmode=no-verify`
    : connectionString;

  // Log connection info (without sensitive data)
  const sanitizedUrl = finalConnectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  console.log("[Prisma] Initializing with URL pattern:", sanitizedUrl);
  console.log("[Prisma] isRemoteDb:", isRemoteDb, "isProduction:", isProduction);

  const adapter = new PrismaPg({
    connectionString: finalConnectionString,
  });
  return new PrismaClient({
    adapter,
    log: isProduction ? ["error"] : ["query", "error", "warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
