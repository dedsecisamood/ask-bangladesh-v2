import { NextRequest, NextResponse } from "next/server";
import { authContext, requireStaff } from "@/lib/auth/server";
import { authFailure } from "@/lib/auth/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const ctx = authContext(request);
    try {
      const staff = await requireStaff(ctx);
      return ctx.finish(NextResponse.json({ data: { role: staff.role } }));
    } catch (error) {
      return ctx.finish(authFailure(error));
    }
  } catch (error) {
    return authFailure(error);
  }
}
