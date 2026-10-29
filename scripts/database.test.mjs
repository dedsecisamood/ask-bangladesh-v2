import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:net";
import pg from "pg";
import {
  assertDisposableConnection,
  assertDisposableName,
  assertLocalDockerEndpoint,
  assertProject,
} from "./database-local.mjs";

test("the fixed local project is configured without a remote link", () =>
  assertProject());
test("only literal local test connection endpoints are allowed", () => {
  assertDisposableConnection(
    "postgresql://postgres:unit-only@127.0.0.1:54322/postgres",
  );
  for (const value of [
    undefined,
    "invalid",
    "postgresql://postgres:unit-only@remote.example.invalid:54322/postgres",
    "postgresql://postgres:unit-only@localhost:54322/postgres",
    "postgresql://postgres:unit-only@127.0.0.1:5432/postgres",
    "postgresql://postgres:unit-only@127.0.0.1:54322/production",
    "postgresql://postgres:unit-only@127.0.0.1:54322/postgres?host=remote.invalid",
  ])
    assert.throws(() => assertDisposableConnection(value));
});
test("disposable names cannot target an existing application or system database", () => {
  assertDisposableName("askbd_p14_test_" + "a".repeat(32));
  for (const value of [
    "postgres",
    "production",
    "askbd_p14_test_",
    "askbd_p14_test_../../",
    'askbd_p14_test_";DROP DATABASE postgres;--',
  ])
    assert.throws(() => assertDisposableName(value));
});
test("local database tooling refuses remote Docker daemons", () => {
  assertLocalDockerEndpoint("npipe:////./pipe/docker_engine");
  assertLocalDockerEndpoint("unix:///var/run/docker.sock");
  for (const value of [
    undefined,
    "ssh://remote",
    "tcp://remote:2375",
    "http://127.0.0.1:2375",
  ])
    assert.throws(() => assertLocalDockerEndpoint(value));
});
test("real PostgreSQL client fails on a closed loopback port without a database", async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  const client = new pg.Client({
    host: "127.0.0.1",
    port: address.port,
    user: "askbd_web",
    database: "unit_only",
    connectionTimeoutMillis: 500,
    ssl: false,
  });
  await assert.rejects(client.connect());
  await client.end();
});
