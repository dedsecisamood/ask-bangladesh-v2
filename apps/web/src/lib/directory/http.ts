import "server-only";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { directoryKind, directoryQuerySchema, slugSchema } from "./contracts";
import {
  cursorBinding,
  decodeCursor,
  encodeCursor,
  CursorError,
  policyRevision,
} from "./cursor";
import { readDirectory } from "./repository";
import { searchInputSchema } from "./search-contract";
import { BodyError, readBodyText } from "../http/body";
function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function directoryGet(
  request: NextRequest,
  params: { kind: string; lookup?: string },
) {
  const request_id = randomUUID();
  const error = (code: string, status: number) =>
    response(
      {
        error: {
          code,
          message:
            status === 503
              ? "Directory information is temporarily unavailable."
              : status === 404
                ? "The requested resource was not found."
                : "The directory request is invalid.",
        },
        request_id,
      },
      status,
    );
  try {
    if (request.url.length > 4096) return error("INVALID_REQUEST", 400);
    const kind = directoryKind.safeParse(params.kind);
    if (!kind.success) return error("RESOURCE_NOT_FOUND", 404);
    const query = new URL(request.url).searchParams;
    if ([...query.keys()].some((k) => query.getAll(k).length !== 1))
      return error("INVALID_REQUEST", 400);
    const parsed = directoryQuerySchema.safeParse(Object.fromEntries(query));
    if (!parsed.success) return error("INVALID_REQUEST", 400);
    const { cursor, ...filters } = parsed.data;
    if (kind.data !== "services" && (filters.category || filters.agency_id))
      return error("INVALID_REQUEST", 400);
    if (kind.data !== "sources" && filters.service_id)
      return error("INVALID_REQUEST", 400);
    if (
      params.lookup &&
      (cursor ||
        query.has("limit") ||
        filters.category ||
        filters.agency_id ||
        filters.service_id)
    )
      return error("INVALID_REQUEST", 400);
    if (
      params.lookup &&
      !(kind.data === "sources" ? z.uuid() : slugSchema).safeParse(
        params.lookup,
      ).success
    )
      return error("INVALID_REQUEST", 400);
    const binding = cursorBinding({ kind: kind.data, ...filters });
    const after = decodeCursor(cursor, binding);
    const result = await readDirectory(
      kind.data,
      filters,
      after?.after,
      params.lookup,
    );
    if (after && after.generation !== result.generation)
      return error("CURSOR_EXPIRED", 400);
    if (params.lookup) {
      if (!result.items[0]) return error("RESOURCE_NOT_FOUND", 404);
      return response({
        data: result.items[0],
        meta: { policy_revision: policyRevision },
        request_id,
      });
    }
    return response({
      data: result.items,
      meta: {
        limit: filters.limit,
        next_cursor: result.after_id
          ? encodeCursor(result.after_id, result.generation, binding)
          : null,
        policy_revision: policyRevision,
      },
      request_id,
    });
  } catch (cause) {
    if (cause instanceof CursorError) return error(cause.code, 400);
    return error("UNAVAILABLE", 503);
  }
}

// Search text stays in a POST body, never in URLs, cursors, logs or stored records.
export async function directorySearch(request: NextRequest) {
  const request_id = randomUUID();
  const fail = (code: string, status: number) =>
    response(
      {
        error: {
          code,
          message:
            status === 503
              ? "Directory information is temporarily unavailable."
              : "The directory search request is invalid.",
        },
        request_id,
      },
      status,
    );
  try {
    if (new URL(request.url).search) return fail("INVALID_REQUEST", 400);
    if (
      request.headers.get("origin") !==
        (process.env.APP_ORIGIN ?? new URL(request.url).origin) ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      return fail("INVALID_ORIGIN", 403);
    if (
      request.headers.get("content-type")?.split(";")[0] !== "application/json"
    )
      return fail("UNSUPPORTED_MEDIA_TYPE", 415);
    const text = await readBodyText(request);
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      return fail("INVALID_REQUEST", 400);
    }
    const parsed = searchInputSchema.safeParse(raw);
    if (!parsed.success) return fail("INVALID_REQUEST", 400);
    const { cursor, ...filters } = parsed.data;
    const binding = cursorBinding({ kind: "services", ...filters });
    const after = decodeCursor(cursor, binding);
    const result = await readDirectory("services", filters, after?.after);
    if (after && after.generation !== result.generation)
      return fail("CURSOR_EXPIRED", 400);
    return response({
      data: result.items,
      meta: {
        limit: filters.limit,
        next_cursor: result.after_id
          ? encodeCursor(result.after_id, result.generation, binding)
          : null,
        policy_revision: policyRevision,
      },
      request_id,
    });
  } catch (cause) {
    if (cause instanceof BodyError) return fail(cause.code, cause.status);
    return fail(
      cause instanceof CursorError ? cause.code : "UNAVAILABLE",
      cause instanceof CursorError ? 400 : 503,
    );
  }
}
