import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { one } from "./shared";
import type { Team, TeamMember } from "@/types";

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

export async function createTeam(name: string, memberName: string) {
  const { data, error } = await createClient().rpc("create_team", {
    p_team_name: name,
    p_member_name: memberName,
  });
  if (error) { logRpcError("create_team", error); throw error; }
  const row = one(data);
  return { teamId: row.team_id ?? row.teamId, teamCode: row.team_code ?? row.teamCode, teamMemberId: row.team_member_id ?? row.teamMemberId };
}

export async function addTeamMember(teamCode: string, memberName: string) {
  const { data, error } = await createClient().rpc("add_team_member", {
    p_team_code: teamCode,
    p_member_name: memberName,
  });
  if (error) {
    logRpcError("add_team_member", error);
    if (error.code === "23505" || error.message.includes("TEAM_MEMBER_NAME_EXISTS")) {
      throw new Error("이미 같은 이름의 팀원이 있어요. 기존 이름을 선택해주세요.");
    }
    throw error;
  }
  const row = one(data);
  return { teamId: row.team_id ?? row.teamId, teamMemberId: row.team_member_id ?? row.teamMemberId };
}

export async function addMemberToOpenOrders(teamMemberId: string) {
  const { data, error } = await createClient().rpc("add_member_to_open_orders", { p_team_member_id: teamMemberId });
  if (error) { logRpcError("add_member_to_open_orders", error); throw error; }
  return typeof data === "number" ? data : 0;
}

export async function getTeamLanding(teamCode: string) {
  const { data, error } = await createClient().rpc("get_team_landing", { p_team_code: teamCode });
  if (error) { logRpcError("get_team_landing", error); throw error; }
  if (data === null) throw new TeamNotFoundError(teamCode);

  const landing = data as { id?: unknown; teamCode?: unknown; name?: unknown; members?: unknown };
  if (typeof landing.id !== "string" || typeof landing.teamCode !== "string" || typeof landing.name !== "string" || !Array.isArray(landing.members)) {
    throw new Error("get_team_landing RPC가 예상한 구조를 반환하지 않았습니다.");
  }
  const members: TeamMember[] = landing.members.map((member, index) => {
    if (!member || typeof member !== "object" || !("id" in member) || !("name" in member) || typeof member.id !== "string" || typeof member.name !== "string") {
      throw new Error(`get_team_landing members[${index}]의 id/name이 올바르지 않습니다.`);
    }
    const isActive = "isActive" in member && typeof member.isActive === "boolean" ? member.isActive : true;
    return { id: member.id, teamId: landing.id as string, name: member.name, isActive, createdAt: "" };
  });
  const team: Team = { id: landing.id, code: landing.teamCode, name: landing.name, createdBy: "", createdAt: "" };
  return { team, members };
}
