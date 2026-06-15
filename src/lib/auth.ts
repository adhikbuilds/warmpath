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
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      // Allow a credentials user who later connects Google with the same email
      // to have both auth methods linked to the same account.
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/contacts.readonly",
            "https://www.googleapis.com/auth/gmail.readonly",
          ].join(" "),
        },
      },
    }),
    // Only register LinkedIn if both credentials are present — an empty secret
    // causes NextAuth to throw a Configuration error for all auth operations.
    ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
      ? [
          LinkedIn({
            clientId: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
          }),
        ]
      : []),
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
      if (account?.type === "oauth" && user.id && user.email) {
        try {
          const existing = await prisma.workspaceMember.findFirst({
            where: { userId: user.id },
          });
          if (!existing) {
            // Check for a pending invite before creating a personal workspace
            const invite = await prisma.workspaceInvitation.findFirst({
              where: {
                email: user.email.toLowerCase(),
                status: "pending",
                expiresAt: { gt: new Date() },
              },
              orderBy: { createdAt: "desc" },
            });

            if (invite) {
              await prisma.$transaction([
                prisma.workspaceMember.create({
                  data: {
                    workspaceId: invite.workspaceId,
                    userId: user.id,
                    role: invite.role,
                    seatStatus: "active",
                  },
                }),
                prisma.workspaceInvitation.update({
                  where: { id: invite.id },
                  data: { status: "accepted", acceptedAt: new Date(), acceptedByUserId: user.id },
                }),
              ]);
            } else {
              const workspaceId = `ws-${user.id}`;
              const wsName = user.name
                ? `${user.name}'s workspace`
                : `${user.email.split("@")[0] ?? "My"} workspace`;
              await prisma.$transaction([
                prisma.workspace.create({
                  data: { id: workspaceId, name: wsName, ownerId: user.id, plan: "free" },
                }),
                prisma.workspaceMember.create({
                  data: { workspaceId, userId: user.id, role: "owner", seatStatus: "active" },
                }),
              ]);
            }
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
