import "server-only";
import { Pool, type QueryResultRow } from "pg";
import { databasePoolConfig } from "./config";
import { DatabaseUnavailableError } from "./connection";

const shared = globalThis as typeof globalThis & { askbdStaffPool?: Pool };
export async function staffQuery<Row extends QueryResultRow>(
  sql: string,
  values: readonly unknown[] = [],
) {
  try {
    if (!shared.askbdStaffPool) {
      const config = databasePoolConfig(
        process.env.ADMIN_DATABASE_URL,
        "askbd_staff",
      );
      if (!config) throw new DatabaseUnavailableError();
      shared.askbdStaffPool = new Pool({
        ...config,
        application_name: "askbd-staff",
      });
      shared.askbdStaffPool.on("error", () =>
        console.error("Staff database unavailable."),
      );
    }
    return await shared.askbdStaffPool.query<Row>(sql, [...values]);
  } catch {
    throw new DatabaseUnavailableError();
  }
}
