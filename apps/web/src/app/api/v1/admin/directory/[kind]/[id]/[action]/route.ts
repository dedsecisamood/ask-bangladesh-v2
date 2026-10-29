import { NextRequest } from "next/server";
import { managementHttp } from "@/lib/directory/manage";
export const runtime = "nodejs";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string; action: string }> },
) {
  return managementHttp(request, await params);
}
