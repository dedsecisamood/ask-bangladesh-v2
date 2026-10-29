// Local development only. Never uses caller-provided DB/identity endpoints.
import { randomBytes, createHmac } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { resolve } from "node:path";
import {
  assertProject,
  requireLocalDocker,
  localDatabaseUrl,
  runDocker,
  root,
} from "./database-local.mjs";

const name = "askbd-auth-local";
const image =
  "supabase/gotrue@sha256:1736a63078f5922b198c4cbe50f80ab9a2d3b54fe8b7b6cfb2e9dc5dbbc12c6b";
function inspected(optional = false) {
  const raw = runDocker(["inspect", name], optional);
  if (!raw) return;
  const info = JSON.parse(raw)[0];
  const binding = info.HostConfig.PortBindings?.["9999/tcp"];
  const hostMode =
    process.platform !== "win32" &&
    info.HostConfig.NetworkMode === "host" &&
    info.Config.Env.includes("GOTRUE_API_HOST=127.0.0.1") &&
    info.Config.Env.includes("GOTRUE_API_PORT=54326");
  if (
    info.Config.Labels?.["askbd.owner"] !== "p16" ||
    (!hostMode &&
      (binding?.length !== 1 ||
        binding[0].HostIp !== "127.0.0.1" ||
        binding[0].HostPort !== "54326"))
  )
    throw new Error("Unexpected local auth container; refusing it.");
  return info;
}
function token(secret, role) {
  const part = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const content =
    part({ alg: "HS256", typ: "JWT" }) +
    "." +
    part({
      role,
      iss: "supabase",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    });
  return (
    content +
    "." +
    createHmac("sha256", secret).update(content).digest("base64url")
  );
}
export function localAuthEnvironment(port = 3000) {
  assertProject();
  requireLocalDocker();
  const info = inspected();
  if (!info?.State.Running) throw new Error("Local auth is not running.");
  const entries = Object.fromEntries(
    info.Config.Env.map((e) => {
      const i = e.indexOf("=");
      return [e.slice(0, i), e.slice(i + 1)];
    }),
  );
  const url = new URL(localDatabaseUrl());
  const runtimeUrl = (role, password) => {
    const next = new URL(url);
    next.username = role;
    next.password = password;
    return next.toString();
  };
  return {
    APP_ORIGIN: `http://127.0.0.1:${port}`,
    SUPABASE_URL: "http://127.0.0.1:54325",
    SUPABASE_PUBLISHABLE_KEY: token(entries.GOTRUE_JWT_SECRET, "anon"),
    DATABASE_URL: runtimeUrl("askbd_web", entries.ASKBD_WEB_PASSWORD),
    ADMIN_DATABASE_URL: runtimeUrl("askbd_staff", entries.ASKBD_STAFF_PASSWORD),
    CURSOR_SIGNING_KEY: createHmac("sha256", entries.GOTRUE_JWT_SECRET)
      .update("askbd-directory-cursor")
      .digest("hex"),
  };
}
export async function startAuth() {
  assertProject();
  requireLocalDocker();
  const settings = new pg.Client({ connectionString: localDatabaseUrl() });
  await settings.connect();
  try {
    if (
      (
        await settings.query(
          "SELECT FROM pg_roles WHERE rolname='askbd_auth_local'",
        )
      ).rowCount
    )
      await settings.query(
        "ALTER ROLE askbd_auth_local SET search_path=auth,public",
      );
  } finally {
    await settings.end();
  }
  let previous = inspected(true);
  if (!previous) {
    const client = new pg.Client({ connectionString: localDatabaseUrl() });
    await client.connect();
    const secret = randomBytes(48).toString("hex"),
      password = randomBytes(32).toString("hex"),
      web = randomBytes(32).toString("hex"),
      staff = randomBytes(32).toString("hex");
    try {
      const exists = await client.query(
        "SELECT shobj_description(oid,'pg_database') marker FROM pg_database WHERE datname='askbd_auth_local'",
      );
      if (exists.rowCount && exists.rows[0].marker !== "askbd.owner=p16")
        throw new Error("Orphaned local auth database requires owner review.");
      if (!exists.rowCount) {
        await client.query(
          "CREATE ROLE askbd_auth_local LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD '" +
            password +
            "'",
        );
        await client.query("CREATE DATABASE askbd_auth_local");
        await client.query(
          "COMMENT ON DATABASE askbd_auth_local IS 'askbd.owner=p16'",
        );
      } else
        await client.query(
          "ALTER ROLE askbd_auth_local PASSWORD '" + password + "'",
        );
      await client.query(
        "GRANT askbd_auth_local TO postgres WITH INHERIT FALSE, SET TRUE",
      );
      await client.query(
        "ALTER ROLE askbd_auth_local SET search_path=auth,public",
      );
      const authUrl = new URL(localDatabaseUrl());
      authUrl.pathname = "/askbd_auth_local";
      const authDb = new pg.Client({ connectionString: authUrl.toString() });
      await authDb.connect();
      try {
        await authDb.query(
          "CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION askbd_auth_local",
        );
        await authDb.query(
          "GRANT CONNECT ON DATABASE askbd_auth_local TO askbd_auth_local",
        );
      } finally {
        await authDb.end();
        await client.query("REVOKE askbd_auth_local FROM postgres");
      }
      // Hex values are generated here, not accepted as SQL input or printed.
      for (const [role, pwd] of [
        ["askbd_web", web],
        ["askbd_staff", staff],
      ]) {
        const checked = await client.query(
          "SELECT rolsuper,rolbypassrls,rolcreaterole FROM pg_roles WHERE rolname=$1",
          [role],
        );
        if (!checked.rows[0] || Object.values(checked.rows[0]).some(Boolean))
          throw new Error("Unsafe runtime role.");
        await client.query(`ALTER ROLE ${role} LOGIN PASSWORD '${pwd}'`);
      }
      const connection = new URL(
        process.platform === "win32"
          ? "postgresql://askbd_auth_local@host.docker.internal:54322/askbd_auth_local"
          : "postgresql://askbd_auth_local@127.0.0.1:54322/askbd_auth_local",
      );
      connection.password = password;
      const env = {
        GOTRUE_DB_DATABASE_URL: connection.toString(),
        GOTRUE_JWT_SECRET: secret,
        ASKBD_WEB_PASSWORD: web,
        ASKBD_STAFF_PASSWORD: staff,
      };
      const args = ["run", "-d", "--name", name, "--label", "askbd.owner=p16"];
      if (process.platform === "win32")
        args.push("--publish", "127.0.0.1:54326:9999");
      else args.push("--network", "host");
      for (const key of Object.keys(env)) args.push("-e", key);
      args.push(
        "-e",
        process.platform === "win32"
          ? "GOTRUE_API_HOST=0.0.0.0"
          : "GOTRUE_API_HOST=127.0.0.1",
        "-e",
        process.platform === "win32"
          ? "GOTRUE_API_PORT=9999"
          : "GOTRUE_API_PORT=54326",
        "-e",
        "API_EXTERNAL_URL=http://127.0.0.1:54325/auth/v1",
        "-e",
        "GOTRUE_DB_DRIVER=postgres",
        "-e",
        "GOTRUE_SITE_URL=http://127.0.0.1:3000",
        "-e",
        "GOTRUE_DISABLE_SIGNUP=true",
        "-e",
        "GOTRUE_EXTERNAL_EMAIL_ENABLED=true",
        "-e",
        "GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED=false",
        "-e",
        "GOTRUE_MAILER_AUTOCONFIRM=false",
        "-e",
        "GOTRUE_JWT_ADMIN_ROLES=service_role",
        "-e",
        "GOTRUE_JWT_AUD=authenticated",
        "-e",
        "GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated",
        "-e",
        "GOTRUE_JWT_EXP=600",
        "-e",
        "GOTRUE_MFA_TOTP_ENROLL_ENABLED=true",
        "-e",
        "GOTRUE_MFA_TOTP_VERIFY_ENABLED=true",
        image,
      );
      runDocker(args, false, env);
    } finally {
      await client.end();
    }
  } else if (!previous.State.Running) runDocker(["start", name]);
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch("http://127.0.0.1:54326/health")).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(
    "Local Supabase Auth health check failed; no success claimed.",
  );
}
export function gateway() {
  // Fixed loopback target. No user-controlled URL, no redirects, no generic proxy.
  const server = createServer(async (req, res) => {
    if (!req.url?.startsWith("/auth/v1/")) {
      res.writeHead(404).end();
      return;
    }
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 16384) {
          res.writeHead(413).end();
          return;
        }
        chunks.push(chunk);
      }
      const upstream = await fetch(
        "http://127.0.0.1:54326/" + req.url.slice(9),
        {
          method: req.method,
          headers: {
            "content-type": req.headers["content-type"] ?? "application/json",
            authorization: req.headers.authorization ?? "",
          },
          body: ["GET", "HEAD"].includes(req.method)
            ? undefined
            : Buffer.concat(chunks),
          redirect: "error",
          signal: AbortSignal.timeout(5000),
        },
      );
      res.writeHead(upstream.status, {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      });
      res.end(Buffer.from(await upstream.arrayBuffer()));
    } catch {
      res.writeHead(503).end();
    }
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(54325, "127.0.0.1", () => resolve(server));
  });
}
export function localAuthAdmin() {
  const info = inspected();
  const entry = info.Config.Env.find((e) => e.startsWith("GOTRUE_JWT_SECRET="));
  return createClient(
    "http://127.0.0.1:54325",
    token(entry.slice(18), "service_role"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
if (process.argv[1] === resolve(root, "scripts/auth-local.mjs")) {
  const command = process.argv[2];
  try {
    if (
      process.argv.length !== 3 ||
      !["start", "stop", "dev"].includes(command)
    )
      throw new Error(
        "Use auth:start, auth:stop or auth:dev without arguments.",
      );
    if (command === "stop") {
      assertProject();
      requireLocalDocker();
      inspected();
      runDocker(["stop", name]);
      console.log("Local auth stopped; no database removed.");
    } else {
      await startAuth();
      const server = await gateway();
      console.log(
        "Local Supabase Auth gateway ready on 127.0.0.1:54325; credentials withheld.",
      );
      if (command === "dev") {
        const child = spawn(
          process.execPath,
          [
            resolve(root, "node_modules/next/dist/bin/next"),
            "dev",
            "--hostname",
            "127.0.0.1",
            "--port",
            "3000",
          ],
          {
            cwd: resolve(root, "apps/web"),
            env: { ...process.env, ...localAuthEnvironment() },
            stdio: "inherit",
            windowsHide: true,
          },
        );
        child.on("exit", (code) => {
          server.close();
          process.exitCode = code ?? 1;
        });
      }
    }
  } catch {
    console.error(
      "Local authentication operation failed; inspect prerequisites. Secrets withheld.",
    );
    process.exitCode = 1;
  }
}
