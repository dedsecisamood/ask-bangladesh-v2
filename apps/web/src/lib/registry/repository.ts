import "server-only";
import { staffQuery } from "../database/staff-connection";
import { requireStaff, type AuthContext } from "../auth/server";
import { registryResultSchema, type RegistryCommand } from "./contracts";
export async function sourceCommand(
  ctx: AuthContext,
  command: RegistryCommand,
  id: string | null,
  payload: Record<string, unknown>,
  revision: string | null,
  key: string,
) {
  const staff = await requireStaff(ctx, "review");
  const result = await staffQuery<{ result: unknown }>(
    "SELECT app_staff.registry_command($1::uuid,$2::uuid,$3::text,$4::text,$5::uuid,$6::jsonb,$7::bigint,$8::uuid) result",
    [
      staff.identity.sub,
      staff.identity.session_id,
      ctx.bindingHash(),
      command,
      id,
      JSON.stringify(payload),
      revision,
      key,
    ],
  );
  return registryResultSchema.parse(result.rows[0]?.result);
}
export async function readSource(ctx: AuthContext, id: string) {
  const staff = await requireStaff(ctx, "inspect");
  const result = await staffQuery<{ result: Record<string, unknown> }>(
    "SELECT app_staff.registry_read($1::uuid,$2::uuid,$3::text,$4::uuid) result",
    [staff.identity.sub, staff.identity.session_id, ctx.bindingHash(), id],
  );
  return result.rows[0]?.result;
}
