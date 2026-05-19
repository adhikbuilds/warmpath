import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";

export async function getWorkspaceId(): Promise<string> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      const member = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true },
      });
      if (member?.workspaceId) return member.workspaceId;
    }
  } catch {}
  return "ws-1";
}
