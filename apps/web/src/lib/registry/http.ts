import "server-only";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  authContext,
  requireStaff,
  AccessError,
  type AuthContext,
} from "../auth/server";
import { sourceCommand, readSource } from "./repository";
import {
  registryAction,
  createSourceSchema,
  updateSourceSchema,
  approveSourceSchema,
  sourceActionSchema,
  type RegistryCommand,
} from "./contracts";
export const statusFor = (code: string) =>
  code === "RATE_LIMITED"
    ? 429
    : code === "FORBIDDEN" ||
        code === "REAUTHENTICATION_REQUIRED" ||
        code === "INDEPENDENT_REVIEW_REQUIRED"
      ? 403
      : code === "RESOURCE_NOT_FOUND"
        ? 404
        : code === "INVALID_REQUEST"
          ? 400
          : 409;
export function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
export async function body(request: NextRequest, ctx: AuthContext) {
  if (
    request.headers.get("origin") !== ctx.config.origin ||
    request.headers.get("host") !== new URL(ctx.config.origin).host ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new AccessError(403, "INVALID_ORIGIN");
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
    throw new AccessError(415, "UNSUPPORTED_MEDIA_TYPE");
  const reader = request.body?.getReader();
  if (!reader) throw new AccessError(400, "INVALID_REQUEST");
  let size = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 16384) {
      await reader.cancel();
      throw new AccessError(413, "REQUEST_TOO_LARGE");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new AccessError(400, "INVALID_REQUEST");
  }
}
export async function registryHttp(
  request: NextRequest,
  params: { id?: string; action?: string } = {},
) {
  let ctx: AuthContext | undefined;
  const request_id = randomUUID();
  const error = (code: string, status: number) =>
    json(
      {
        error: {
          code,
          message:
            status === 503
              ? "Source registry is temporarily unavailable."
              : "The source registry operation could not be completed.",
        },
        request_id,
      },
      status,
    );
  try {
    ctx = authContext(request);
    await requireStaff(ctx, request.method === "GET" ? "inspect" : "review");
    if (params.id && !z.uuid().safeParse(params.id).success)
      throw new AccessError(400, "INVALID_REQUEST");
    if (new URL(request.url).search)
      throw new AccessError(400, "INVALID_REQUEST");
    if (request.method === "GET") {
      if (!params.id) throw new AccessError(404, "RESOURCE_NOT_FOUND");
      const data = await readSource(ctx, params.id);
      if (!data) throw new AccessError(503, "UNAVAILABLE");
      if (typeof data.error_code === "string")
        return ctx.finish(error(data.error_code, statusFor(data.error_code)));
      return ctx.finish(json({ data, request_id }));
    }
    const key = z.uuid().safeParse(request.headers.get("idempotency-key"));
    if (!key.success) throw new AccessError(400, "INVALID_IDEMPOTENCY_KEY");
    const input = await body(request, ctx);
    let command: RegistryCommand;
    let payload: Record<string, unknown>;
    let revision: string | null = null;
    if (!params.id) {
      command = "create";
      const parsed = createSourceSchema.safeParse(input);
      if (!parsed.success) throw new AccessError(400, "INVALID_REQUEST");
      payload = parsed.data;
    } else {
      if (params.action) {
        const action = registryAction.safeParse(params.action);
        if (!action.success) throw new AccessError(404, "RESOURCE_NOT_FOUND");
        command = action.data;
      } else command = "update";
      const parsed = (
        command === "update"
          ? updateSourceSchema
          : command === "approve"
            ? approveSourceSchema
            : sourceActionSchema
      ).safeParse(input);
      if (!parsed.success) throw new AccessError(400, "INVALID_REQUEST");
      const { revision: rev, ...rest } = parsed.data;
      revision = rev;
      payload = rest;
    }
    const result = await sourceCommand(
      ctx,
      command,
      params.id ?? null,
      payload,
      revision,
      key.data,
    );
    if ("error_code" in result)
      return ctx.finish(error(result.error_code, statusFor(result.error_code)));
    return ctx.finish(
      json({ data: result, request_id }, command === "create" ? 201 : 200),
    );
  } catch (cause) {
    const response = error(
      cause instanceof AccessError ? cause.code : "UNAVAILABLE",
      cause instanceof AccessError ? cause.status : 503,
    );
    return ctx ? ctx.finish(response) : response;
  }
}
