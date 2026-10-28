import { redirect } from "next/navigation";
import { auth, getCurrentRole } from "@/lib/auth";
import { Providers } from "@/components/providers";
import Link from "next/link";
import { LayoutDashboard, FileText, Settings, Users, LogOut, MessageSquare } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Toaster from "@/components/admin/toast";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  const role = (await getCurrentRole()) ?? "Viewer";

  return (
    <Providers>
      <div className="flex min-h-screen bg-gray-100">
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-y-auto bg-white shadow-md">
          <AdminSidebar role={role} />
        </aside>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
        <Toaster />
      </div>
    </Providers>
  );
}
