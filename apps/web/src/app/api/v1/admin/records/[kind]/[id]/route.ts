import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authContext, requireStaff, AccessError } from "@/lib/auth/server";
import { authFailure } from "@/lib/auth/http";
import { inspectRecord, inspectionKind } from "@/lib/directory/repository";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kind: string; id: string }> },
) {
  try {
    const ctx = authContext(request);
    try {
      await requireStaff(ctx);
      const params = await context.params;
      const kind = inspectionKind.safeParse(params.kind),
        id = z.uuid().safeParse(params.id);
      if (!kind.success || !id.success)
        throw new AccessError(400, "INVALID_REQUEST");
      const data = await inspectRecord(ctx, kind.data, id.data);
      if (!data) throw new AccessError(404, "RESOURCE_NOT_FOUND");
      return ctx.finish(NextResponse.json({ data }));
    } catch (error) {
      return ctx.finish(authFailure(error));
    }
  } catch (error) {
    return authFailure(error);
  }
}
