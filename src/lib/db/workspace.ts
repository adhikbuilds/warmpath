import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";

const DEMO_USER_EMAIL = "demo@warmpath.ai";

export type WorkspaceContext = { workspaceId: string; isDemo: boolean };

/** Returns workspace ID + whether the current user is the demo user.
 *  Use this instead of getWorkspaceId() in routes that conditionally
 *  show demo data — only the demo user gets the demo data fallback. */
export async function getWorkspaceContext(): Promise<WorkspaceContext> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      const isDemo = session.user.email === DEMO_USER_EMAIL;
      const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true },
      });
      if (member?.workspaceId) return { workspaceId: member.workspaceId, isDemo };

      const workspaceId = `ws-${session.user.id}`;
      await prisma
        .$transaction([
          prisma.workspace.create({
            data: { id: workspaceId, name: "My Workspace", ownerId: session.user.id, plan: "free" },
          }),
          prisma.workspaceMember.create({
            data: { workspaceId, userId: session.user.id, role: "owner", seatStatus: "active" },
          }),
        ])
        .catch(() => {});
      return { workspaceId, isDemo };
    }
  } catch {}
  return { workspaceId: "", isDemo: false };
}

export async function getWorkspaceId(): Promise<string> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true },
      });
      if (member?.workspaceId) return member.workspaceId;

      // Authenticated but no workspace — auto-create one so data never leaks
      // to the "ws-1" fallback (which would mix this user with demo data).
      const workspaceId = `ws-${session.user.id}`;
      await prisma
        .$transaction([
          prisma.workspace.create({
            data: { id: workspaceId, name: "My Workspace", ownerId: session.user.id, plan: "free" },
          }),
          prisma.workspaceMember.create({
            data: { workspaceId, userId: session.user.id, role: "owner", seatStatus: "active" },
          }),
        ])
        .catch(() => {
          // Race condition: another request may have created it concurrently — ignore.
        });
      return workspaceId;
    }
  } catch {}
  // Unauthenticated — return empty string so Prisma queries return nothing.
  return "";
}
