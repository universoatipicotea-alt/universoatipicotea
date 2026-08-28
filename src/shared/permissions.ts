export const PERMISSIONS = {
  MANAGE_USERS: "manage_users",
  MANAGE_CONTENT: "manage_content",
  MANAGE_PRODUCTS: "manage_products",
  MANAGE_CAMPAIGNS: "manage_campaigns",
  MODERATE_FORUM: "moderate_forum",
  VIEW_METRICS: "view_metrics",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LABELS: Record<Permission, string> = {
  manage_users: "Gerenciar usuários",
  manage_content: "Gerenciar conteúdo",
  manage_products: "Gerenciar produtos",
  manage_campaigns: "Gerenciar campanhas",
  moderate_forum: "Moderar fórum",
  view_metrics: "Visualizar métricas",
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];
