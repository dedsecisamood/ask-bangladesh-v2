import { NextRequest } from "next/server";
import { registryHttp } from "@/lib/registry/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; action: string }> },
) {
  return registryHttp(request, await context.params);
}
