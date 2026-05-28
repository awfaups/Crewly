import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { readServerEnv } from "../env";
import * as schema from "./schema";

export function createDatabase() {
  const { databaseUrl } = readServerEnv();
  if (!databaseUrl) return null;

  const client = postgres(databaseUrl, {
    max: 10,
    prepare: false,
  });

  return drizzle(client, { schema });
}
