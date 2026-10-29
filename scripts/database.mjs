import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import {
  assertProject,
  requireLocalDocker,
  localDatabaseUrl,
  runDatabaseTests,
  supabase,
  startLocalDatabase,
  stopLocalDatabase,
  root,
} from "./database-local.mjs";

const [command, ...extra] = process.argv.slice(2);
try {
  if (
    extra.length ||
    !["start", "stop", "status", "migrate", "types", "test"].includes(command)
  )
    throw new Error(
      "Use only the documented db scripts; extra flags, resets and remote operations are not accepted.",
    );
  assertProject();
  requireLocalDocker();
  if (command === "start") {
    startLocalDatabase();
    const deadline = Date.now() + 120_000;
    for (;;) {
      try {
        localDatabaseUrl();
        break;
      } catch (error) {
        if (Date.now() >= deadline) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    console.log(
      "Local PostgreSQL ready on 127.0.0.1:54322; credentials withheld.",
    );
  } else if (command === "stop") {
    stopLocalDatabase();
    console.log(
      "Local project stopped; no reset or volume deletion requested.",
    );
  } else {
    localDatabaseUrl();
    if (command === "migrate" || command === "test")
      supabase(["migration", "up"]);
    if (command === "types") {
      const generated = supabase([
        "gen",
        "types",
        "typescript",
        "--schema",
        "app_private",
      ]);
      if (!generated.includes("export type Database"))
        throw new Error(
          "Type generation did not return the expected TypeScript contract.",
        );
      writeFileSync(resolve(root, "database/generated.types.ts"), generated);
      const formatted = spawnSync(
        process.execPath,
        [
          resolve(root, "node_modules/prettier/bin/prettier.cjs"),
          "--write",
          resolve(root, "database/generated.types.ts"),
        ],
        { cwd: root, stdio: "pipe", windowsHide: true },
      );
      if (formatted.status !== 0)
        throw new Error("Generated schema type formatting failed.");
    }
    if (command === "test") process.exitCode = runDatabaseTests();
    else
      console.log(`Local database ${command} completed; no secrets printed.`);
  }
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Local database operation failed.",
  );
  process.exitCode = 1;
}
