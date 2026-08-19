const TEAM_MEMBER_STORAGE_KEY = "coffee-order-team-members";

type StoredTeamMembers = Record<string, string>;

function readStoredTeamMembers(): StoredTeamMembers {
  if (typeof window === "undefined") return {};
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(TEAM_MEMBER_STORAGE_KEY) ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  } catch {
    return {};
  }
}

export function loadTeamMemberId(teamCode: string) {
  return readStoredTeamMembers()[teamCode.toUpperCase()] ?? null;
}

export function saveTeamMemberId(teamCode: string, teamMemberId: string) {
  if (typeof window === "undefined") return;
  const stored = readStoredTeamMembers();
  stored[teamCode.toUpperCase()] = teamMemberId;
  window.localStorage.setItem(TEAM_MEMBER_STORAGE_KEY, JSON.stringify(stored));
}

export function clearTeamMemberId(teamCode: string) {
  if (typeof window === "undefined") return;
  const stored = readStoredTeamMembers();
  delete stored[teamCode.toUpperCase()];
  window.localStorage.setItem(TEAM_MEMBER_STORAGE_KEY, JSON.stringify(stored));
}
