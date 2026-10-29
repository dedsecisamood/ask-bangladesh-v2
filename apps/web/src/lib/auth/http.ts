import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AccessError,
  authContext,
  identify,
  requireStaff,
  type AuthContext,
} from "./server";
import { verifiedIdentity } from "./config";
import { staffQuery } from "../database/staff-connection";
import { BodyError, readBodyText } from "../http/body";

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
function html(ctx: AuthContext, title: string, body: string, status = 200) {
  const response = new NextResponse(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} | Ask Bangladesh</title><style>body{font:1rem/1.6 system-ui;max-width:45rem;margin:3rem auto;padding:1rem;background:#faf9f5;color:#143c38}input,button{display:block;padding:.65rem;margin:.5rem 0 1rem;max-width:100%;font:inherit}a{color:#075d52}code{overflow-wrap:anywhere}</style><main><h1>${escape(title)}</h1><p>Independent Ask Bangladesh staff access. Public information requires no account.</p>${body}<p><a href="/bn">Return to public website</a></p></main></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  return ctx.finish(response);
}
const loginForm = `<form method="post" action="/admin/sign-in"><label>Email<input name="email" type="email" autocomplete="username" required maxlength="254"></label><label>Password<input name="password" type="password" autocomplete="current-password" required maxlength="256"></label><button>Sign in</button></form>`;
async function form(request: NextRequest, ctx: AuthContext) {
  if (
    request.headers.get("origin") !== ctx.config.origin ||
    request.headers.get("host") !== new URL(ctx.config.origin).host ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new AccessError(403, "INVALID_ORIGIN");
  if (
    request.headers.get("content-type")?.split(";")[0] !==
    "application/x-www-form-urlencoded"
  )
    throw new AccessError(415, "UNSUPPORTED_MEDIA_TYPE");
  let text: string;
  try {
    text = await readBodyText(request);
  } catch (error) {
    if (error instanceof BodyError)
      throw new AccessError(error.status, error.code);
    throw error;
  }
  const values = new URLSearchParams(text);
  if ([...values.keys()].some((k) => values.getAll(k).length !== 1))
    throw new AccessError(400, "INVALID_REQUEST");
  return Object.fromEntries(values);
}
async function member(ctx: AuthContext) {
  const identity = await identify(ctx);
  const row = await staffQuery<{ id: string; role: string }>(
    "SELECT id,role FROM app_staff.membership($1::uuid)",
    [identity.user.id],
  );
  if (!row.rows[0]) throw new AccessError(403, "FORBIDDEN");
  return identity;
}
function redirect(ctx: AuthContext, path: string) {
  return ctx.finish(
    NextResponse.redirect(new URL(path, ctx.config.origin), 303),
  );
}
export function authFailure(error: unknown) {
  const status = error instanceof AccessError ? error.status : 503;
  const code = error instanceof AccessError ? error.code : "UNAVAILABLE";
  return NextResponse.json(
    { error: { code, message: "Staff access could not be completed." } },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
export async function adminGet(request: NextRequest) {
  let ctx: AuthContext | undefined;
  try {
    ctx = authContext(request);
    const path = new URL(request.url).pathname;
    if (path === "/admin/sign-in") return html(ctx, "Staff sign in", loginForm);
    if (path === "/admin/mfa") {
      await member(ctx);
      const { data, error } = await ctx.client.auth.mfa.listFactors();
      if (error) throw new AccessError(503, "AUTH_UNAVAILABLE");
      const factor = data.totp.find((f) => f.status === "verified");
      return html(
        ctx,
        "Multi-factor authentication",
        factor
          ? `<form method="post" action="/admin/mfa"><input type="hidden" name="factor_id" value="${escape(factor.id)}"><label>Authenticator code<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" required></label><button>Verify code</button></form>`
          : `<p>A verified authenticator is required. Enroll after signing in with your password.</p><form method="post" action="/admin/enroll"><button>Enroll authenticator</button></form>`,
      );
    }
    if (path !== "/admin") throw new AccessError(404, "RESOURCE_NOT_FOUND");
    const staff = await requireStaff(ctx);
    return html(
      ctx,
      "Administration foundation",
      `<p>Authorized role: <strong>${escape(staff.role)}</strong>.</p><p>The full administrative dashboard is scheduled for Phase 9. No source-management operations are enabled.</p><form method="post" action="/admin/logout"><button>Sign out</button></form>`,
    );
  } catch (error) {
    const response = authFailure(error);
    return ctx ? ctx.finish(response) : response;
  }
}
export async function adminPost(request: NextRequest) {
  let ctx: AuthContext | undefined;
  try {
    ctx = authContext(request);
    const fields = await form(request, ctx);
    const path = new URL(request.url).pathname;
    if (path === "/admin/logout") {
      await staffQuery("SELECT app_staff.logout_bound($1::text)", [
        ctx.bindingHash(),
      ]);
      try {
        await ctx.client.auth.signOut({ scope: "local" });
      } catch {
        /* Local revocation already committed. */
      }
      ctx.clear();
      ctx.bind("");
      return redirect(ctx, "/admin/sign-in");
    }
    const budget = await staffQuery<{ ok: boolean }>(
      "SELECT app_staff.consume_auth_budget() ok",
    );
    if (!budget.rows[0]?.ok) throw new AccessError(429, "RATE_LIMITED");
    if (path === "/admin/sign-in") {
      const parsed = z
        .object({
          email: z.email().max(254),
          password: z.string().min(1).max(256),
        })
        .strict()
        .safeParse(fields);
      if (!parsed.success) throw new AccessError(400, "INVALID_REQUEST");
      const result = await ctx.client.auth.signInWithPassword(parsed.data);
      if (result.error)
        throw new AccessError(
          result.error.status && result.error.status >= 500 ? 503 : 401,
          "SIGN_IN_FAILED",
        );
      try {
        await member(ctx);
      } catch (error) {
        await ctx.client.auth.signOut({ scope: "local" });
        throw error;
      }
      return redirect(ctx, "/admin/mfa");
    }
    const identity = await member(ctx);
    if (path === "/admin/enroll") {
      const factors = await ctx.client.auth.mfa.listFactors();
      if (factors.error) throw new AccessError(503, "AUTH_UNAVAILABLE");
      if (factors.data.totp.some((f) => f.status === "verified"))
        await requireStaff(ctx, "inspect");
      if (
        Object.keys(fields).length ||
        typeof identity.claims.iat !== "number" ||
        Date.now() - identity.claims.iat * 1000 > 5 * 60_000
      )
        throw new AccessError(403, "REAUTHENTICATION_REQUIRED");
      const result = await ctx.client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Ask Bangladesh staff",
      });
      if (result.error) throw new AccessError(400, "ENROLLMENT_FAILED");
      return html(
        ctx,
        "Set up authenticator",
        `<p>Add this secret to your authenticator app. Keep it private.</p><code>${escape(result.data.totp.secret)}</code><form method="post" action="/admin/mfa"><input type="hidden" name="factor_id" value="${escape(result.data.id)}"><label>Authenticator code<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" required></label><button>Verify authenticator</button></form>`,
      );
    }
    if (path !== "/admin/mfa") throw new AccessError(404, "RESOURCE_NOT_FOUND");
    const parsed = z
      .object({ factor_id: z.uuid(), code: z.string().regex(/^\d{6}$/) })
      .strict()
      .safeParse(fields);
    if (!parsed.success) throw new AccessError(400, "INVALID_REQUEST");
    const verification = await ctx.client.auth.mfa.challengeAndVerify({
      factorId: parsed.data.factor_id,
      code: parsed.data.code,
    });
    if (verification.error) throw new AccessError(401, "MFA_FAILED");
    const signed = verifiedIdentity.safeParse((await identify(ctx)).claims);
    if (!signed.success) throw new AccessError(403, "MFA_REQUIRED");
    const binding = randomBytes(32).toString("hex");
    const opened = await staffQuery<{ ok: boolean }>(
      "SELECT app_staff.open_bound_session($1::uuid,$2::uuid,$3::text) ok",
      [
        signed.data.sub,
        signed.data.session_id,
        createHash("sha256").update(binding).digest("hex"),
      ],
    );
    if (!opened.rows[0]?.ok) throw new AccessError(403, "SESSION_EXPIRED");
    ctx.bind(binding);
    return redirect(ctx, "/admin");
  } catch (error) {
    const response = authFailure(error);
    return ctx ? ctx.finish(response) : response;
  }
}
