import "server-only";
import {
  Pool,
  type PoolClient,
  type QueryResultRow,
  type QueryResult,
} from "pg";
import { databasePoolConfig } from "./config";

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("Database is unavailable. No database result was returned.");
    this.name = "DatabaseUnavailableError";
  }
}
type SharedDatabase = typeof globalThis & { askbdDatabasePool?: Pool };
const shared = globalThis as SharedDatabase;

function pool(): Pool {
  if (shared.askbdDatabasePool) return shared.askbdDatabasePool;
  const config = databasePoolConfig(process.env.DATABASE_URL);
  if (!config) throw new DatabaseUnavailableError();
  const instance = new Pool(config);
  instance.on("error", () =>
    console.error("Database background connection unavailable."),
  );
  shared.askbdDatabasePool = instance;
  return instance;
}
// Only repository-owned parameterized SQL belongs here. No public route uses it in P14.
export async function databaseQuery<Row extends QueryResultRow>(
  sql: string,
  values: readonly unknown[] = [],
): Promise<QueryResult<Row>> {
  try {
    return await pool().query<Row>(sql, [...values]);
  } catch {
    throw new DatabaseUnavailableError();
  }
}
export async function databaseTransaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  let client: PoolClient | undefined;
  let discard = false;
  try {
    client = await pool().connect();
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch {
        discard = true;
      }
    }
    throw new DatabaseUnavailableError();
  } finally {
    client?.release(discard);
  }
}
export async function closeDatabasePool(): Promise<void> {
  const current = shared.askbdDatabasePool;
  delete shared.askbdDatabasePool;
  try {
    if (current) await current.end();
  } catch {
    throw new DatabaseUnavailableError();
  }
}
