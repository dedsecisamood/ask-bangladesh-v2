import { NextRequest } from "next/server";
import { registryHttp } from "@/lib/registry/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return registryHttp(request, await context.params);
}
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return registryHttp(request, await context.params);
}
