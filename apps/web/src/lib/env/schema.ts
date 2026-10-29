import { z } from "zod";

const invalidConfigurationMessage =
  "Invalid environment configuration: APP_ORIGIN must be an HTTPS origin, or an HTTP origin on localhost, 127.0.0.1 or [::1], without credentials, paths, query strings, fragments or whitespace.";

function isSupportedOrigin(value: string): boolean {
  const origin = /^https?:\/\/([^/?#\\]+)\/?$/iu.exec(value);

  if (!origin || /\s/u.test(value)) {
    return false;
  }

  try {
    const url = new URL(value);

    if (url.username || url.password || origin[1].includes("@")) {
      return false;
    }

    return (
      url.protocol === "https:" ||
      (url.protocol === "http:" &&
        /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/iu.test(origin[1]))
    );
  } catch {
    return false;
  }
}

const environmentSchema = z.object({
  CHAT_MODE: z.enum(["demo", "api"]).optional(),
  APP_ORIGIN: z
    .string()
    .refine(isSupportedOrigin)
    .transform((value) => new URL(value).origin)
    .optional(),
});

export type ServerEnvironment = Readonly<z.infer<typeof environmentSchema>>;

export function parseServerEnvironment(
  input: Readonly<{ APP_ORIGIN?: unknown; CHAT_MODE?: unknown }>,
): ServerEnvironment {
  const result = environmentSchema.safeParse(input);

  if (!result.success) {
    throw new Error(invalidConfigurationMessage);
  }

  return Object.freeze(result.data);
}
