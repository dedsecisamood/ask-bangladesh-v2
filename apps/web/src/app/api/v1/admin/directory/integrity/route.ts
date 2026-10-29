import { NextRequest } from "next/server";
import { authContext, requireStaff, AccessError } from "@/lib/auth/server";
import { staffQuery } from "@/lib/database/staff-connection";
import { json } from "@/lib/registry/http";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  let ctx;
  try {
    ctx = authContext(request);
    const s = await requireStaff(ctx, "inspect");
    if (new URL(request.url).search)
      throw new AccessError(400, "INVALID_REQUEST");
    const r = await staffQuery<{ data: unknown }>(
      "SELECT app_staff.directory_integrity($1::uuid,$2::uuid,$3::text) data",
      [s.identity.sub, s.identity.session_id, ctx.bindingHash()],
    );
    return ctx.finish(json({ data: r.rows[0].data }));
  } catch (cause) {
    const r = json(
      {
        error: {
          code: cause instanceof AccessError ? cause.code : "UNAVAILABLE",
          message: "Integrity information is unavailable.",
        },
      },
      cause instanceof AccessError ? cause.status : 503,
    );
    return ctx ? ctx.finish(r) : r;
  }
}
