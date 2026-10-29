import "server-only";
import { cache } from "react";
import { z } from "zod";
import { databaseQuery } from "../database/connection";
import { staffQuery } from "../database/staff-connection";
import { requireStaff, type AuthContext } from "../auth/server";
import { directoryItemSchema, type DirectoryKind } from "./contracts";
const resultSchema = z
  .object({
    items: z.array(directoryItemSchema),
    after_id: z.uuid().nullable(),
    generation: z.string().regex(/^\d+$/),
  })
  .strict();
export interface DirectoryFilters {
  locale: "bn" | "en";
  limit: number;
  category?: string;
  agency_id?: string;
  service_id?: string;
  query?: string;
}
export async function readDirectory(
  kind: DirectoryKind,
  filters: DirectoryFilters,
  after?: string,
  lookup?: string,
) {
  const result = await databaseQuery<{ result: unknown }>(
    "SELECT app_public.directory_search($1::text,$2::text,$3::uuid,$4::integer,$5::text,$6::uuid,$7::text,$8::text,$9::uuid) result",
    [
      kind,
      filters.locale,
      after ?? null,
      filters.limit,
      filters.category ?? null,
      filters.agency_id ?? null,
      lookup ?? null,
      filters.query ?? "",
      filters.service_id ?? null,
    ],
  );
  return resultSchema.parse(result.rows[0]?.result);
}
// Request-scoped deduplication; no cross-request publication cache.
export const readDirectoryDetail = cache(
  (kind: DirectoryKind, locale: "bn" | "en", lookup: string) =>
    readDirectory(kind, { locale, limit: 1 }, undefined, lookup),
);
export async function readServiceRelations(id: string, locale: "bn" | "en") {
  const r = await databaseQuery<{ result: unknown }>(
    "SELECT app_public.service_relations($1::uuid,$2::text) result",
    [id, locale],
  );
  const parsed = z
    .object({
      categories: z.array(directoryItemSchema),
      agencies: z.array(directoryItemSchema),
      sources: z.array(directoryItemSchema),
    })
    .strict()
    .parse(r.rows[0]?.result);
  return {
    ...parsed,
    agencies: [...new Map(parsed.agencies.map((a) => [a.id, a])).values()],
  };
}
export const inspectionKind = z.enum([
  "agencies",
  "categories",
  "services",
  "domains",
  "sources",
  "documents",
  "versions",
  "passages",
  "verifications",
]);
export async function inspectRecord(
  ctx: AuthContext,
  kind: z.infer<typeof inspectionKind>,
  id: string,
) {
  const staff = await requireStaff(ctx, "inspect");
  const result = await staffQuery<{ data: Record<string, unknown> | null }>(
    "SELECT app_staff.inspect_record($1::uuid,$2::uuid,$3::text,$4::text,$5::uuid) data",
    [
      staff.identity.sub,
      staff.identity.session_id,
      ctx.bindingHash(),
      kind,
      id,
    ],
  );
  return result.rows[0]?.data ?? null;
}
