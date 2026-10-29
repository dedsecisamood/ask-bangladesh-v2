import { directoryResponseSchema, type DirectoryKind } from "./contracts";
// Explicit same-origin API adapter for Phase 4. The Phase 2 demo is not switched implicitly.
export async function fetchPublishedDirectory(
  kind: DirectoryKind,
  locale: "bn" | "en",
  signal?: AbortSignal,
) {
  const response = await fetch(`/api/v1/${kind}?locale=${locale}`, {
    signal,
    cache: "no-store",
    credentials: "omit",
  });
  if (!response.ok) throw new Error("Published directory is unavailable.");
  return directoryResponseSchema.parse(await response.json());
}
