/* eslint-disable @typescript-eslint/no-explicit-any -- relation shape is normalized here. */
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { one, team, user, type Row } from "./shared";

export class TeamNotFoundError extends Error {
  constructor(public readonly teamCode: string) {
    super(`팀 코드 ${teamCode}에 해당하는 팀이 없습니다.`);
    this.name = "TeamNotFoundError";
  }
}

function logRpcError(rpc: string, error: PostgrestError) {
  console.error(`[Supabase RPC: ${rpc}]`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

export async function createTeam(name: string, memberNames: string[], creatorName: string) {
  const { data, error } = await createClient().rpc("create_team_with_members", { p_team_name: name, p_member_names: memberNames, p_current_member_name: creatorName });
  if (error) { logRpcError("create_team_with_members", error); throw error; }
  const row = one(data);
  return { teamId: row.team_id ?? row.teamId, teamCode: row.team_code ?? row.teamCode, teamMemberId: row.team_member_id ?? row.teamMemberId };
}

export async function getTeamLanding(teamCode: string) {
  const { data, error } = await createClient().rpc("get_team_landing", { p_team_code: teamCode });
  if (error) { logRpcError("get_team_landing", error); throw error; }
  if (data == null || (Array.isArray(data) && data.length === 0)) throw new TeamNotFoundError(teamCode);
  const root = one(data);
  const teamRow = root.team ?? root;
  if (!teamRow || !(teamRow.id ?? teamRow.team_id)) throw new TeamNotFoundError(teamCode);
  const members: Row[] = root.team_members ?? root.members ?? [];
  return { team: team(teamRow), members: members.map(user) };
}

export async function joinTeam(teamCode: string, teamMemberId: string) {
  const { data, error } = await createClient().rpc("join_team_as_member", { p_team_code: teamCode, p_team_member_id: teamMemberId });
  if (error) { logRpcError("join_team_as_member", error); throw error; }
  return one(data);
}

export async function getCurrentTeamMember(teamId: string) {
  const { data, error } = await createClient().from("team_member_sessions").select("team_member_id, team_members!inner(id, name, created_at, team_id)").eq("team_members.team_id", teamId).maybeSingle();
  if (error) {
    console.error("[Supabase query: team_member_sessions]", { code: error.code, message: error.message, details: error.details, hint: error.hint });
    throw error;
  }
  const member = (data as any)?.team_members;
  return member ? user(member) : null;
}
