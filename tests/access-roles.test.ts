import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ACCESS_ROLES,
  DEFAULT_ACCESS_ROLE,
  accessRoleAfterSubscription,
  accessRoleForLegacyUser,
  canAccessMemberContent,
  isAdminRole,
  isMasterRole,
  legacyValuesForAccessRole,
} from "../src/shared/access.ts";

test("os quatro papéis têm permissões explícitas", () => {
  assert.deepEqual(ACCESS_ROLES, ["visitor", "member", "admin", "admin_master"]);
  assert.equal(canAccessMemberContent("visitor"), false);
  assert.equal(canAccessMemberContent("member"), true);
  assert.equal(canAccessMemberContent("admin"), true);
  assert.equal(canAccessMemberContent("admin_master"), true);
  assert.equal(isAdminRole("member"), false);
  assert.equal(isAdminRole("admin"), true);
  assert.equal(isMasterRole("admin"), false);
  assert.equal(isMasterRole("admin_master"), true);
});

test("novo usuário começa como visitor", () => {
  assert.equal(DEFAULT_ACCESS_ROLE, "visitor");
});

test("pagamento e expiração alteram somente visitor/member", () => {
  assert.equal(accessRoleAfterSubscription("visitor", true), "member");
  assert.equal(accessRoleAfterSubscription("member", false), "visitor");
  assert.equal(accessRoleAfterSubscription("admin", false), "admin");
  assert.equal(accessRoleAfterSubscription("admin_master", false), "admin_master");
});

test("usuários existentes são migrados sem perder privilégios", () => {
  assert.equal(accessRoleForLegacyUser("master", "member"), "admin_master");
  assert.equal(accessRoleForLegacyUser("admin", "member"), "admin");
  assert.equal(accessRoleForLegacyUser("user", "member"), "member");
  assert.equal(accessRoleForLegacyUser("user", "free"), "member");
  assert.equal(accessRoleForLegacyUser("user", "canceled"), "visitor");
});

test("espelhamento legado é compatível e não autoriza por si só", () => {
  assert.deepEqual(legacyValuesForAccessRole("visitor"), {
    role: "user",
    membershipStatus: "canceled",
  });
  assert.deepEqual(legacyValuesForAccessRole("member"), {
    role: "user",
    membershipStatus: "member",
  });
  assert.deepEqual(legacyValuesForAccessRole("admin"), {
    role: "admin",
    membershipStatus: "member",
  });
  assert.deepEqual(legacyValuesForAccessRole("admin_master"), {
    role: "master",
    membershipStatus: "member",
  });
});

test("migration é aditiva, mantém RLS e não apaga usuários", () => {
  const migration = readFileSync(
    new URL("../supabase/migrations/20260903193000_add_access_role.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /ADD COLUMN IF NOT EXISTS access_role/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /admin_master/);
  assert.doesNotMatch(migration, /DELETE\s+FROM|TRUNCATE|DROP\s+TABLE/i);
});
