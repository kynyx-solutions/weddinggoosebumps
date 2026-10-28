import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { can, type Permission } from "./permissions";

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          }
        });

        if (!user || !user.password) {
          return null;
        }

        // Locked after five wrong passwords in a row, for 15 minutes
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          const failures = user.failedLogins + 1;
          await prisma.user.update({
            where: { id: user.id },
            data:
              failures >= MAX_FAILED_LOGINS
                ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) }
                : { failedLogins: failures },
          });
          return null;
        }

        if (user.failedLogins > 0 || user.lockedUntil) {
          await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
});

// Admin pages render in parallel with the admin layout, so the layout's login redirect doesn't
// stop a page's own queries from streaming data to logged-out visitors. Every admin page that
// loads data calls this before querying.
export async function requireAdmin(allowed?: (role: string) => boolean) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (allowed) {
    const role = await currentRole(session.user.id);
    if (!role || !allowed(role)) redirect("/admin?denied=1");
  }
  return session;
}

// The role is read fresh on every request, so a role change or removal applies straight away
// rather than at the next login
async function currentRole(userId: string | undefined) {
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return null;
  // Until someone is a Super Admin (older databases default everyone to Viewer), nobody is locked out
  if (user.role !== "Super Admin" && (await prisma.user.count({ where: { role: "Super Admin" } })) === 0) {
    return "Super Admin";
  }
  return user.role;
}

export type Access = { session: Session; role: string } | { denied: NextResponse };

// For admin API routes: a logged-in user, and when given, one whose role allows `permission`
export async function authorize(permission: Permission | null): Promise<Access> {
  const session = await auth();
  const role = await currentRole(session?.user?.id);
  if (!session?.user || !role) return { denied: new NextResponse("Unauthorized", { status: 401 }) };
  if (permission && !can(role, permission)) {
    return {
      denied: NextResponse.json(
        { success: false, message: "Your role doesn't allow this change. Ask a Super Admin." },
        { status: 403 }
      ),
    };
  }
  return { session, role };
}

export async function getCurrentRole() {
  const session = await auth();
  return currentRole(session?.user?.id);
}
