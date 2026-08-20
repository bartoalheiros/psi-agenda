import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "prisma/config";

const envPath = path.resolve(process.cwd(), ".env");
const envConfig: Record<string, string> = {};

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    envConfig[key] = value.replace(/^['"]|['"]$/g, "");
  }
}

const databaseUrl = process.env.DATABASE_URL ?? envConfig.DATABASE_URL ?? "file:./dev.db";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: databaseUrl,
  },
});
