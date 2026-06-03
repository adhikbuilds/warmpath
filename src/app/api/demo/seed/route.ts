import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/client";

export async function POST() {
  try {
    const DEMO_EMAIL = "demo@warmpath.ai";
    const DEMO_PASSWORD = "demo123";

    let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });

    if (!user) {
      const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
      user = await prisma.user.create({
        data: {
          email: DEMO_EMAIL,
          name: "Demo User",
          password: hash,
          role: "owner",
        },
      });
    }

    const existingMember = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
    });

    if (!existingMember) {
      const workspace = await prisma.workspace.create({
        data: {
          name: "WarmBlue Demo",
          ownerId: user.id,
          onboardingStage: "completed",
          plan: "growth",
        },
      });
      await prisma.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: user.id, role: "owner" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[demo/seed]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
