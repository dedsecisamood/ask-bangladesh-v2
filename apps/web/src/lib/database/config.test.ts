import { describe, expect, it } from "vitest";
import { databasePoolConfig } from "./config";

describe("optional, least-privilege database configuration", () => {
  it("needs no database credentials to render or build", () => {
    expect(databasePoolConfig(undefined)).toBeUndefined();
  });
  it("bounds the local pool and keeps credentials separate from URL options", () => {
    const config = databasePoolConfig(
      "postgresql://askbd_web:unit-only@127.0.0.1:54322/postgres",
    );
    expect(config).toMatchObject({
      user: "askbd_web",
      host: "127.0.0.1",
      port: 54322,
      ssl: false,
      max: 5,
      connectionTimeoutMillis: 2000,
      query_timeout: 4000,
    });
    expect(config).not.toHaveProperty("connectionString");
  });
  it("always verifies TLS for remote databases and decodes password characters safely", () => {
    const config = databasePoolConfig(
      "postgres://askbd_web:unit%40only@db.example.invalid/app",
    );
    expect(config?.ssl).toEqual({ rejectUnauthorized: true });
    expect(config?.password).toBe("unit@only");
    expect(
      databasePoolConfig("postgres://askbd_web:unit-only@[::1]/postgres")?.host,
    ).toBe("::1");
  });
  it.each([
    "",
    "not-a-url",
    "https://askbd_web:unit-only@example.invalid/app",
    "postgresql://postgres:unit-only@127.0.0.1/postgres",
    "postgresql://service_role:unit-only@example.invalid/app",
    "postgresql://askbd_web@127.0.0.1/postgres",
    "postgresql://askbd_web:unit-only@localhost/postgres",
    "postgresql://askbd_web:unit-only@127.0.0.1/",
    "postgresql://askbd_web:unit-only@example.invalid/app?sslmode=disable",
    "postgresql://askbd_web:unit-only@example.invalid/app#fragment",
    "postgresql://askbd_web:unit-only@127.0.0.1/app path",
  ])("rejects unsafe configuration without copying values: %s", (value) => {
    expect(() => databasePoolConfig(value)).toThrow("Invalid DATABASE_URL");
    try {
      databasePoolConfig(value);
    } catch (error) {
      expect((error as Error).message).not.toContain("unit-only");
    }
  });
});
