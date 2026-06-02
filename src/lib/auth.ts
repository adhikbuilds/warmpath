import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import { prisma } from "@/lib/db/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: { params: { prompt: "select_account" } },
    }),
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID ?? "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        demo: { label: "Demo", type: "text" },
      },
      async authorize(credentials) {
        const email =
          credentials?.demo === "true" ? "demo@warmpath.ai" : String(credentials?.email ?? "");
        const password =
          credentials?.demo === "true" ? "demo123" : String(credentials?.password ?? "");

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Auto-provision a workspace for first-time OAuth sign-ins
      if (account?.type === "oauth" && user.id) {
        try {
          const existing = await prisma.workspaceMember.findFirst({
            where: { userId: user.id },
          });
          if (!existing) {
            const workspaceId = `ws-${user.id}`;
            const wsName = user.name
              ? `${user.name}'s workspace`
              : `${user.email?.split("@")[0] ?? "My"} workspace`;
            await prisma.$transaction([
              prisma.workspace.create({
                data: { id: workspaceId, name: wsName, ownerId: user.id, plan: "free" },
              }),
              prisma.workspaceMember.create({
                data: { workspaceId, userId: user.id, role: "owner", seatStatus: "active" },
              }),
            ]);
          }
        } catch {}
      }
      return true;
    },

    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});
