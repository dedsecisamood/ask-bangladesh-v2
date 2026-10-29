import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({
  query: vi.fn(),
  connect: vi.fn(),
  end: vi.fn(),
  release: vi.fn(),
  on: vi.fn(),
  construction: vi.fn(),
}));
vi.mock("pg", () => ({
  Pool: class {
    constructor(config: unknown) {
      mock.construction(config);
    }
    query = mock.query;
    connect = mock.connect;
    end = mock.end;
    on = mock.on;
  },
}));
import {
  databaseQuery,
  databaseTransaction,
  closeDatabasePool,
  DatabaseUnavailableError,
} from "./connection";
afterEach(async () => {
  await closeDatabasePool();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
const configure = () =>
  vi.stubEnv(
    "DATABASE_URL",
    "postgresql://askbd_web:unit-only@127.0.0.1:54322/postgres",
  );
describe("server-only pooled access (mock tests, not migration evidence)", () => {
  it("fails explicitly when unconfigured, without creating a pool", async () => {
    vi.stubEnv("DATABASE_URL", undefined);
    await expect(databaseQuery("SELECT 1")).rejects.toBeInstanceOf(
      DatabaseUnavailableError,
    );
    expect(mock.construction).not.toHaveBeenCalled();
  });
  it("reuses one lazy pool, preserves parameters and sanitizes connection failures", async () => {
    configure();
    mock.query
      .mockResolvedValueOnce({ rows: [{ id: "synthetic" }] })
      .mockRejectedValueOnce(new Error("private sql unit-only"));
    expect(
      (
        await databaseQuery<{ id: string }>("SELECT $1::text AS id", [
          "synthetic",
        ])
      ).rows[0].id,
    ).toBe("synthetic");
    await expect(databaseQuery("SELECT 1")).rejects.toThrow(
      "Database is unavailable",
    );
    expect(mock.query).toHaveBeenCalledWith("SELECT $1::text AS id", [
      "synthetic",
    ]);
    expect(mock.construction).toHaveBeenCalledOnce();
    expect(mock.on).toHaveBeenCalledWith("error", expect.any(Function));
  });
  it("commits a transaction and releases its single checked-out connection", async () => {
    configure();
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: mock.release,
    };
    mock.connect.mockResolvedValueOnce(client);
    expect(
      await databaseTransaction(async (connection) => {
        await connection.query("SELECT $1::text", ["synthetic"]);
        return "done";
      }),
    ).toBe("done");
    expect(client.query.mock.calls.map((call) => call[0])).toEqual([
      "BEGIN",
      "SELECT $1::text",
      "COMMIT",
    ]);
    expect(mock.release).toHaveBeenCalledWith(false);
  });
  it.each([false, true])(
    "rolls back failures and discards the connection if rollback fails: %s",
    async (rollbackFails) => {
      configure();
      const client = {
        query: vi.fn().mockResolvedValueOnce({ rows: [] }),
        release: mock.release,
      };
      if (rollbackFails)
        client.query.mockRejectedValueOnce(
          new Error("private rollback detail"),
        );
      mock.connect.mockResolvedValueOnce(client);
      await expect(
        databaseTransaction(async () => {
          throw new Error("private transaction detail");
        }),
      ).rejects.toThrow("Database is unavailable");
      expect(client.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mock.release).toHaveBeenCalledWith(rollbackFails);
    },
  );
  it("sanitizes failed checkout without trying to release an absent client", async () => {
    configure();
    mock.connect.mockRejectedValueOnce(
      new Error("unit-only password rejected"),
    );
    await expect(databaseTransaction(async () => "unused")).rejects.toThrow(
      "Database is unavailable",
    );
    expect(mock.release).not.toHaveBeenCalled();
  });
});
