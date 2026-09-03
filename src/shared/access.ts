export const ACCESS_ROLES = ["visitor", "member", "admin", "admin_master"] as const;

export type AccessRole = (typeof ACCESS_ROLES)[number];
export const DEFAULT_ACCESS_ROLE: AccessRole = "visitor";

export function isAccessRole(value: unknown): value is AccessRole {
  return typeof value === "string" && ACCESS_ROLES.includes(value as AccessRole);
}

export function isAdminRole(role: AccessRole) {
  return role === "admin" || role === "admin_master";
}

export function isMasterRole(role: AccessRole) {
  return role === "admin_master";
}

export function canAccessMemberContent(role: AccessRole) {
  return role === "member" || isAdminRole(role);
}

export function accessRoleAfterSubscription(role: AccessRole, active: boolean): AccessRole {
  if (isAdminRole(role)) return role;
  return active ? "member" : "visitor";
}

export function accessRoleForLegacyUser(role: string, membershipStatus: string): AccessRole {
  if (role === "master") return "admin_master";
  if (role === "admin") return "admin";
  if (membershipStatus === "member" || membershipStatus === "free") return "member";
  return "visitor";
}

export function legacyValuesForAccessRole(role: AccessRole) {
  if (role === "admin_master") return { role: "master", membershipStatus: "member" } as const;
  if (role === "admin") return { role: "admin", membershipStatus: "member" } as const;
  if (role === "member") return { role: "user", membershipStatus: "member" } as const;
  return { role: "user", membershipStatus: "canceled" } as const;
}
