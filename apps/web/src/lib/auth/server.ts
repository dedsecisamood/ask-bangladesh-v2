import "server-only";
import { createHash } from "node:crypto";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { parseAuthConfig, staffRole, verifiedIdentity } from "./config";
import { staffQuery } from "../database/staff-connection";

export class AccessError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
export function authContext(request: NextRequest) {
  const config = parseAuthConfig(process.env);
  if (!config) throw new AccessError(503, "AUTH_UNAVAILABLE");
  const pending = new Map<string, { value: string; options: CookieOptions }>();
  const client = createServerClient(config.url, config.key, {
    cookieOptions: {
      name: config.secure ? "__Host-askbd-auth" : "askbd-auth",
      path: "/",
      httpOnly: true,
      secure: config.secure,
      sameSite: "strict",
      maxAge: 12 * 60 * 60,
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        for (const cookie of cookies) {
          request.cookies.set(cookie.name, cookie.value);
          pending.set(cookie.name, cookie);
        }
      },
    },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
          signal: AbortSignal.timeout(5_000),
        }),
    },
  });
  const bindingName = config.secure ? "__Host-askbd-staff" : "askbd-staff";
  return {
    bindingHash: () => {
      const value = request.cookies.get(bindingName)?.value;
      return value && /^[a-f0-9]{64}$/.test(value)
        ? createHash("sha256").update(value).digest("hex")
        : null;
    },
    bind: (value: string) =>
      pending.set(bindingName, {
        value,
        options: { maxAge: value ? 43200 : 0 },
      }),
    clear: () => {
      for (const { name } of request.cookies.getAll())
        if (name.startsWith(config.secure ? "__Host-askbd-" : "askbd-"))
          pending.set(name, { value: "", options: { maxAge: 0 } });
    },
    client,
    config,
    finish(response: NextResponse) {
      response.headers.set("Cache-Control", "private, no-store");
      response.headers.set("Pragma", "no-cache");
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      response.headers.set("Referrer-Policy", "no-referrer");
      for (const [name, cookie] of pending)
        response.cookies.set(name, cookie.value, {
          ...cookie.options,
          httpOnly: true,
          secure: config.secure,
          sameSite: "strict",
          path: "/",
        });
      return response;
    },
  };
}
export type AuthContext = ReturnType<typeof authContext>;
export async function identify(ctx: AuthContext) {
  // Cookies/user_metadata never establish identity or privilege.
  const user = await ctx.client.auth.getUser();
  if (user.error)
    throw new AccessError(
      !user.error.status || user.error.status >= 500 ? 503 : 401,
      "UNAUTHENTICATED",
    );
  if (!user.data.user) throw new AccessError(401, "UNAUTHENTICATED");
  const claims = await ctx.client.auth.getClaims();
  if (
    claims.error ||
    !claims.data ||
    claims.data.claims.sub !== user.data.user.id
  )
    throw new AccessError(401, "UNAUTHENTICATED");
  return { user: user.data.user, claims: claims.data.claims };
}
export async function requireStaff(ctx: AuthContext, capability = "inspect") {
  const { claims } = await identify(ctx);
  const identity = verifiedIdentity.safeParse(claims);
  if (!identity.success || identity.data.exp * 1000 <= Date.now())
    throw new AccessError(403, "MFA_REQUIRED");
  const result = await staffQuery<{ id: string; role: string }>(
    "SELECT id,role FROM app_staff.authorize_bound($1::uuid,$2::uuid,$3::text,$4::text)",
    [
      identity.data.sub,
      identity.data.session_id,
      capability,
      ctx.bindingHash(),
    ],
  );
  if (!result.rows[0]) throw new AccessError(403, "FORBIDDEN");
  return {
    id: result.rows[0].id,
    role: staffRole.parse(result.rows[0].role),
    identity: identity.data,
  };
}
