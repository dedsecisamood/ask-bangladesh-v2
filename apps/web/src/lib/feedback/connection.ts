import "server-only";
import { Pool, type QueryResultRow } from "pg";
import { databasePoolConfig } from "../database/config";
import { DatabaseUnavailableError } from "../database/connection";

const shared = globalThis as typeof globalThis & { askbdFeedbackPool?: Pool };
export async function feedbackQuery<Row extends QueryResultRow>(
  sql: string,
  values: readonly unknown[] = [],
) {
  try {
    if (!shared.askbdFeedbackPool) {
      const config = databasePoolConfig(
        process.env.FEEDBACK_DATABASE_URL,
        "askbd_feedback",
      );
      if (!config) throw new DatabaseUnavailableError();
      shared.askbdFeedbackPool = new Pool({
        ...config,
        max: 2,
        application_name: "askbd-feedback",
      });
      shared.askbdFeedbackPool.on("error", () =>
        console.error("Feedback database unavailable."),
      );
    }
    return await shared.askbdFeedbackPool.query<Row>(sql, [...values]);
  } catch {
    throw new DatabaseUnavailableError();
  }
}
