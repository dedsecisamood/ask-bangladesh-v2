import "server-only";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  authContext,
  requireStaff,
  AccessError,
  type AuthContext,
} from "../auth/server";
import { staffQuery } from "../database/staff-connection";
import { body, json, statusFor } from "../registry/http";
import {
  reviewProof,
  revisionSchema,
  reasonSchema,
} from "../registry/contracts";
import { slugSchema } from "./contracts";
export const managedKind = z.enum(["agencies", "categories", "services"]);
const translation = z
  .object({
    locale: z.enum(["bn", "en"]),
    name: z.string().trim().min(1).max(240),
    description: z.string().max(2000).nullable().default(null),
  })
  .strict();
const common = {
  slug: slugSchema,
  translations: z.array(translation).min(1).max(2),
  reason: reasonSchema,
};
export const identityInput = z
  .object({ ...common, parent_id: z.uuid().nullable().default(null) })
  .strict();
export const serviceInput = z
  .object({
    ...common,
    primary_category_id: z.uuid(),
    category_ids: z.array(z.uuid()).min(1).max(16),
    agencies: z
      .array(
        z
          .object({
            id: z.uuid(),
            relationship: z.enum(["responsible", "supporting"]),
          })
          .strict(),
      )
      .min(1)
      .max(16),
    source_ids: z.array(z.uuid()).max(32).default([]),
    aliases: z
      .array(
        z
          .object({
            alias: z
              .string()
              .trim()
              .min(1)
              .max(200)
              .transform((s) => s.normalize("NFC").replace(/\s+/gu, " ")),
            language: z.enum(["bn", "en", "banglish"]),
          })
          .strict(),
      )
      .max(64)
      .default([]),
  })
  .strict()
  .refine(
    (v) =>
      v.category_ids.includes(v.primary_category_id) &&
      v.agencies.some((a) => a.relationship === "responsible"),
  );
const resultSchema = z.union([
  z.object({ id: z.uuid(), revision: revisionSchema }).strict(),
  z
    .object({
      error_code: z.enum([
        "FORBIDDEN",
        "REVISION_CONFLICT",
        "INVALID_REQUEST",
        "INDEPENDENT_REVIEW_REQUIRED",
        "REAUTHENTICATION_REQUIRED",
        "IDEMPOTENCY_CONFLICT",
        "RESOURCE_NOT_FOUND",
        "RATE_LIMITED",
        "DUPLICATE_RECORD",
        "INVALID_RELATIONSHIP",
      ]),
    })
    .strict(),
]);
export async function managementHttp(
  request: NextRequest,
  params: { kind?: string; id?: string; action?: string },
  linkCheck = false,
) {
  let ctx: AuthContext | undefined;
  const request_id = randomUUID();
  const fail = (code: string, status: number) =>
    json(
      {
        error: {
          code,
          message:
            status === 503
              ? "Directory administration is temporarily unavailable."
              : "The directory operation could not be completed.",
        },
        request_id,
      },
      status,
    );
  try {
    ctx = authContext(request);
    const staff = await requireStaff(ctx, "review");
    if (new URL(request.url).search)
      throw new AccessError(400, "INVALID_REQUEST");
    const key = z.uuid().parse(request.headers.get("idempotency-key"));
    if (params.id && !z.uuid().safeParse(params.id).success)
      throw new AccessError(400, "INVALID_REQUEST");
    const input = await body(request, ctx);
    let payload: Record<string, unknown>;
    let revision: string | null = null;
    let command = "create";
    const kind = linkCheck ? "sources" : managedKind.parse(params.kind);
    if (params.id) {
      command = params.action ?? "update";
      const action = z
        .object({
          reason: reasonSchema,
          revision: revisionSchema,
          ...(command === "publish" ? { proof: reviewProof } : {}),
        })
        .strict();
      const { revision: rev, ...rest } = z
        .object({ revision: revisionSchema })
        .passthrough()
        .parse(input);
      revision = rev;
      payload =
        command === "update"
          ? (kind === "services" ? serviceInput : identityInput).parse(rest)
          : action.omit({ revision: true }).parse(rest);
      if (!["update", "publish", "withdraw", "link-check"].includes(command))
        throw new AccessError(404, "RESOURCE_NOT_FOUND");
    } else
      payload = (kind === "services" ? serviceInput : identityInput).parse(
        input,
      );
    const values = [
      staff.identity.sub,
      staff.identity.session_id,
      ctx.bindingHash(),
    ];
    const query = linkCheck
      ? "SELECT app_staff.request_link_check($1::uuid,$2::uuid,$3::text,$4::uuid,$5::jsonb,$6::bigint,$7::uuid) result"
      : "SELECT app_staff.directory_command($1::uuid,$2::uuid,$3::text,$4::text,$5::text,$6::uuid,$7::jsonb,$8::bigint,$9::uuid) result";
    const r = await staffQuery<{ result: unknown }>(
      query,
      linkCheck
        ? [...values, params.id, JSON.stringify(payload), revision, key]
        : [
            ...values,
            kind,
            command,
            params.id ?? null,
            JSON.stringify(payload),
            revision,
            key,
          ],
    );
    const result = resultSchema.parse(r.rows[0]?.result);
    if ("error_code" in result) {
      const status =
        result.error_code === "INVALID_RELATIONSHIP"
          ? 400
          : statusFor(result.error_code);
      return ctx.finish(fail(result.error_code, status));
    }
    return ctx.finish(
      json({ data: result, request_id }, command === "create" ? 201 : 200),
    );
  } catch (cause) {
    const response = fail(
      cause instanceof AccessError
        ? cause.code
        : cause instanceof z.ZodError
          ? "INVALID_REQUEST"
          : "UNAVAILABLE",
      cause instanceof AccessError
        ? cause.status
        : cause instanceof z.ZodError
          ? 400
          : 503,
    );
    return ctx ? ctx.finish(response) : response;
  }
}
