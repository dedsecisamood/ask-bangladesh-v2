import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve, dirname, delimiter } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = resolve(root, "node_modules/supabase/dist/supabase.js");
const candidates =
  process.platform === "win32"
    ? [
        resolve(
          process.env.LOCALAPPDATA ?? "",
          "Programs/DockerDesktop/resources/bin/docker.exe",
        ),
        resolve(
          process.env.ProgramFiles ?? "C:/Program Files",
          "Docker/Docker/resources/bin/docker.exe",
        ),
      ]
    : [];
const docker = candidates.find((path) => existsSync(path)) ?? "docker";
const env = {
  ...process.env,
  PATH:
    docker === "docker"
      ? process.env.PATH
      : dirname(docker) + delimiter + process.env.PATH,
  SUPABASE_EXPERIMENTAL_STACK: "0",
  SUPABASE_TELEMETRY_DISABLED: "1",
  DO_NOT_TRACK: "1",
};
const container = "askbd-postgres-local";
const volume = "askbd-postgres-local-data";
// Supabase PostgreSQL 17.11.0.004 manifest; multi-platform digest, not a floating tag.
const image =
  "public.ecr.aws/supabase/postgres@sha256:b15d862126dd2dac02da524696ccfde2dcce2ceaee0a58973b2727befe492706";
export function runDocker(args, optional = false, extraEnv = {}) {
  return run(docker, args, optional, extraEnv);
}
function run(binary, args, optional = false, extraEnv = {}) {
  const result = spawnSync(binary, args, {
    cwd: root,
    env: { ...env, ...extraEnv },
    encoding: "utf8",
    windowsHide: true,
    timeout: 900_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    if (optional) return;
    throw new Error(
      binary === docker
        ? "Local Docker operation failed; no database success claimed."
        : "Local Supabase command failed; credentials and raw diagnostics withheld.",
    );
  }
  return result.stdout;
}
export function assertLocalDockerEndpoint(endpoint) {
  if (
    typeof endpoint !== "string" ||
    !/^(?:npipe:\/\/|unix:\/\/)/u.test(endpoint)
  )
    throw new Error(
      "Remote Docker engines are not allowed for local database commands.",
    );
}
export function requireLocalDocker() {
  if (process.env.DOCKER_HOST)
    assertLocalDockerEndpoint(process.env.DOCKER_HOST);
  const context = JSON.parse(runDocker(["context", "inspect"]));
  assertLocalDockerEndpoint(context[0]?.Endpoints?.docker?.Host);
  runDocker(["info", "--format", "{{.ServerVersion}}"]);
}
export function assertProject() {
  const config = readFileSync(
    resolve(root, "database/supabase/config.toml"),
    "utf8",
  );
  if (
    !/^project_id = "askbd-local"$/mu.test(config) ||
    !/^port = 54322$/mu.test(config)
  )
    throw new Error("Unexpected local database project configuration.");
  if (existsSync(resolve(root, "database/supabase/.temp/project-ref")))
    throw new Error(
      "A linked project marker exists; local tooling refuses to run.",
    );
}
export function assertDisposableConnection(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Missing or invalid local database endpoint.");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    url.hostname !== "127.0.0.1" ||
    url.port !== "54322" ||
    url.pathname !== "/postgres" ||
    url.username !== "postgres" ||
    !url.password ||
    url.search ||
    url.hash
  )
    throw new Error("Refusing non-local or unexpected database target.");
  return url;
}
export function assertDisposableName(value) {
  if (!/^askbd_p14_test_[a-f0-9]{32}$/u.test(value))
    throw new Error(
      "Refusing a database name outside the disposable test namespace.",
    );
}
function inspectContainer(optional = false) {
  const inspected = runDocker(["inspect", container], optional);
  if (!inspected) return;
  const info = JSON.parse(inspected)[0];
  const ports = info?.HostConfig?.PortBindings?.["5432/tcp"];
  if (
    info?.Config?.Labels?.["askbd.owner"] !== "p14" ||
    !Array.isArray(ports) ||
    ports.length !== 1 ||
    ports[0].HostIp !== "127.0.0.1" ||
    ports[0].HostPort !== "54322" ||
    !info.Mounts.some(
      (mount) =>
        mount.Name === volume &&
        mount.Destination === "/var/lib/postgresql/data",
    )
  )
    throw new Error(
      "Refusing an unexpected container, volume or non-loopback port binding.",
    );
  return info;
}
export function startLocalDatabase() {
  assertProject();
  requireLocalDocker();
  const previous = inspectContainer(true);
  if (previous) {
    if (!previous.State.Running) runDocker(["start", container]);
  } else {
    const stored = runDocker(["volume", "inspect", volume], true);
    if (stored && JSON.parse(stored)[0]?.Labels?.["askbd.owner"] !== "p14")
      throw new Error("Refusing a foreign local volume.");
    if (stored)
      throw new Error(
        "An orphaned project volume exists; owner review is required before reusing it with new credentials.",
      );
    runDocker(["volume", "create", "--label", "askbd.owner=p14", volume]);
    const password = randomBytes(32).toString("hex");
    runDocker(
      [
        "run",
        "-d",
        "--name",
        container,
        "--label",
        "askbd.owner=p14",
        "--publish",
        "127.0.0.1:54322:5432",
        "--mount",
        `type=volume,source=${volume},target=/var/lib/postgresql/data`,
        "-e",
        "POSTGRES_PASSWORD",
        "-e",
        "POSTGRES_DB=postgres",
        "-e",
        "PGDATA=/var/lib/postgresql/data",
        "--health-cmd",
        "pg_isready -U postgres -d postgres",
        "--health-interval",
        "2s",
        "--health-timeout",
        "2s",
        "--health-retries",
        "60",
        image,
      ],
      false,
      { POSTGRES_PASSWORD: password },
    );
  }
}
export function localDatabaseUrl() {
  assertProject();
  requireLocalDocker();
  const info = inspectContainer();
  if (!info?.State?.Running || info.State.Health?.Status !== "healthy")
    throw new Error(
      "Local PostgreSQL is not healthy; start it and retry after initialization.",
    );
  const password = info.Config.Env.find((value) =>
    value.startsWith("POSTGRES_PASSWORD="),
  )?.slice(18);
  if (!password) throw new Error("Local database credential is missing.");
  const url = new URL("postgresql://postgres@127.0.0.1:54322/postgres");
  url.password = password;
  assertDisposableConnection(url.toString());
  return url.toString();
}
export function stopLocalDatabase() {
  inspectContainer();
  runDocker(["stop", container]);
}
export function supabase(args) {
  if (!existsSync(cli))
    throw new Error("Pinned Supabase CLI is missing; run npm ci.");
  const url = assertDisposableConnection(localDatabaseUrl());
  const password = decodeURIComponent(url.password);
  url.password = "";
  return run(
    process.execPath,
    [
      cli,
      ...args,
      "--db-url",
      url.toString(),
      "--workdir",
      "database",
      "--agent",
      "no",
    ],
    false,
    { PGPASSWORD: password, SUPABASE_DB_PASSWORD: password },
  );
}
export function runDatabaseTests() {
  return (
    spawnSync(process.execPath, ["--test", "database/tests/core.test.mjs"], {
      cwd: root,
      env,
      stdio: "inherit",
      windowsHide: true,
    }).status ?? 1
  );
}
