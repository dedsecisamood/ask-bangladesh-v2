import "server-only";
export function publishedDirectoryEnabled() {
  const value = process.env.DIRECTORY_MODE ?? "demo";
  if (value !== "demo" && value !== "published")
    throw new Error("DIRECTORY_MODE must be demo or published.");
  return value === "published";
}
