import { NextRequest } from "next/server";
import { registryHttp } from "@/lib/registry/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  return registryHttp(request);
}
