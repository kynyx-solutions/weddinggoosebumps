// Who may change what in the admin panel. Shared by the API checks and the sidebar, so it stays
// free of database code.

export const ROLES = ["Super Admin", "Editor", "Marketing", "Viewer"] as const;

export type Permission = "content" | "leads" | "seo" | "settings" | "users";

const GRANTS: Record<string, Permission[]> = {
  "Super Admin": ["content", "leads", "seo", "settings", "users"],
  // Posts, events, site content, destinations, galleries, media
  Editor: ["content"],
  // Leads, SEO, redirects, contact and WhatsApp settings
  Marketing: ["leads", "seo", "settings"],
  // Can look at everything except users, change nothing
  Viewer: [],
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  "Super Admin": "Everything, including adding users and changing roles",
  Editor: "Posts, site content, destinations, galleries and images",
  Marketing: "Leads, SEO, redirects and site settings",
  Viewer: "Can look around, can't change anything",
};

export function can(role: string | undefined, permission: Permission) {
  return GRANTS[role ?? ""]?.includes(permission) ?? false;
}

// Leads hold personal details: only the roles that work them, plus Viewer (read-only)
export function canSeeLeads(role: string | undefined) {
  return can(role, "leads") || role === "Viewer";
}
