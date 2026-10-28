import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { can } from "@/lib/permissions";
import UsersManager from "./UsersManager";

const dateFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });

export default async function UsersPage() {
  const session = await requireAdmin((role) => can(role, "users"));
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true, lockedUntil: true },
  });

  return (
    <UsersManager
      currentUserId={session.user?.id ?? ""}
      initialUsers={users.map((user) => ({
        id: user.id,
        name: user.name ?? "",
        email: user.email ?? "",
        role: user.role,
        addedLabel: dateFormat.format(user.createdAt),
        locked: Boolean(user.lockedUntil && user.lockedUntil > new Date()),
      }))}
    />
  );
}
