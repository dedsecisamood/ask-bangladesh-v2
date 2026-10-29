import { z } from "zod";
import { parseServerEnvironment } from "../env/schema";

export const staffRole = z.enum([
  "owner",
  "administrator",
  "source_reviewer",
  "auditor",
]);
export type StaffRole = z.infer<typeof staffRole>;
export const verifiedIdentity = z.object({
  sub: z.uuid(),
  session_id: z.uuid(),
  aal: z.literal("aal2"),
  exp: z.number().int().positive(),
});
export function parseAuthConfig(input: Record<string, string | undefined>) {
  if (!input.SUPABASE_URL && !input.SUPABASE_PUBLISHABLE_KEY) return;
  try {
    const { APP_ORIGIN } = parseServerEnvironment({
      APP_ORIGIN: input.APP_ORIGIN,
    });
    if (!APP_ORIGIN || !input.SUPABASE_URL || !input.SUPABASE_PUBLISHABLE_KEY)
      throw new Error();
    const url = new URL(input.SUPABASE_URL);
    const key = input.SUPABASE_PUBLISHABLE_KEY;
    const publicKey =
      key.startsWith("sb_publishable_") ||
      (key.split(".").length === 3 &&
        JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8"))
          .role === "anon");
    if (!publicKey) throw new Error();
    if (
      url.origin !== input.SUPABASE_URL ||
      url.username ||
      url.password ||
      (url.protocol !== "https:" &&
        !(url.protocol === "http:" && url.hostname === "127.0.0.1"))
    )
      throw new Error();
    return {
      url: url.origin,
      key: input.SUPABASE_PUBLISHABLE_KEY,
      origin: APP_ORIGIN,
      secure: APP_ORIGIN.startsWith("https:"),
    };
  } catch {
    throw new Error(
      "Invalid staff authentication configuration. Check APP_ORIGIN and server-only Supabase settings.",
    );
  }
}
export function can(role: StaffRole, capability: string): boolean {
  return (
    capability === "inspect" ||
    (capability === "review" && role !== "auditor") ||
    (capability === "operate" && ["owner", "administrator"].includes(role)) ||
    (capability === "manage_roles" && role === "owner")
  );
}
