import type { PoolConfig } from "pg";

const invalid =
  "Invalid DATABASE_URL: use a PostgreSQL URL with the dedicated application role, a password, a database name and no URL options. Remote connections require verified TLS.";
// Pure validation: no environment access, client creation, network or secret logging.
export function databasePoolConfig(
  value: string | undefined,
  role:
    | "askbd_web"
    | "askbd_staff"
    | "askbd_embedder"
    | "askbd_feedback" = "askbd_web",
): PoolConfig | undefined {
  if (value === undefined) return;
  try {
    const url = new URL(value);
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      url.username !== role ||
      !url.password ||
      !url.hostname ||
      !/^\/[a-zA-Z0-9_-]+$/u.test(url.pathname) ||
      url.search ||
      url.hash ||
      /\s/u.test(value)
    )
      throw new Error();
    const local = url.hostname === "127.0.0.1" || url.hostname === "[::1]";
    if (url.hostname === "localhost") throw new Error();
    return {
      host: url.hostname.replace(/^\[|\]$/gu, ""),
      port: url.port ? Number(url.port) : 5432,
      database: decodeURIComponent(url.pathname.slice(1)),
      user: role,
      password: decodeURIComponent(url.password),
      ssl: local ? false : { rejectUnauthorized: true },
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 2_000,
      statement_timeout: 3_000,
      query_timeout: 4_000,
      application_name: "askbd-web",
      options: "-c search_path=pg_catalog",
    };
  } catch {
    throw new Error(invalid);
  }
}
