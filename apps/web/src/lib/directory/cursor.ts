import "server-only";
import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import { z } from "zod";
const cursorSchema = z
  .object({
    after: z.uuid(),
    generation: z.string().regex(/^\d+$/),
    binding: z.string(),
    exp: z.number().int(),
  })
  .strict();
export const policyRevision = "p20-metadata-v1";
export class CursorError extends Error {
  constructor(public code = "INVALID_CURSOR") {
    super(code);
  }
}
function key() {
  const value = process.env.CURSOR_SIGNING_KEY;
  if (!value || !/^[a-f0-9]{64,128}$/.test(value))
    throw new Error("Directory cursor configuration unavailable.");
  return Buffer.from(value, "hex");
}
export function cursorBinding(filters: Readonly<Record<string, unknown>>) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        Object.fromEntries(
          Object.entries({ ...filters, policyRevision }).sort(([a], [b]) =>
            a.localeCompare(b),
          ),
        ),
      ),
    )
    .digest("hex");
}
export function encodeCursor(
  after: string,
  generation: string,
  binding: string,
) {
  const payload = Buffer.from(
    JSON.stringify({
      after,
      generation,
      binding,
      exp: Math.floor(Date.now() / 1000) + 1800,
    }),
  ).toString("base64url");
  return (
    payload +
    "." +
    createHmac("sha256", key()).update(payload).digest("base64url")
  );
}
export function decodeCursor(value: string | undefined, binding: string) {
  if (!value) return;
  try {
    const [payload, signature, ...extra] = value.split(".");
    if (
      extra.length ||
      !payload ||
      !signature ||
      !/^[A-Za-z0-9_-]+$/.test(payload + signature)
    )
      throw new CursorError();
    const expected = createHmac("sha256", key()).update(payload).digest();
    const provided = Buffer.from(signature, "base64url");
    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    )
      throw new CursorError();
    const parsed = cursorSchema.parse(
      JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
    );
    if (parsed.binding !== binding) throw new CursorError();
    if (parsed.exp <= Date.now() / 1000)
      throw new CursorError("CURSOR_EXPIRED");
    return parsed;
  } catch (error) {
    if (error instanceof CursorError) throw error;
    throw new CursorError();
  }
}
