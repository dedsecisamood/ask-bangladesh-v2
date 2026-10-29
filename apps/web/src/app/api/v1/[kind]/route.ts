import { NextRequest } from "next/server";
import { directoryGet } from "@/lib/directory/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kind: string }> },
) {
  return directoryGet(request, await context.params);
}
