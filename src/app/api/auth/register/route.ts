import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";

const INTEL_URL = process.env.INTELLIGENCE_SERVICE_URL ?? "http://localhost:8001";
const INTEL_SECRET = process.env.INTELLIGENCE_SERVICE_SECRET ?? "";

export async function POST(req: NextRequest) {
  const { name, email, password, companyName } = await req.json();

  if (!email || !password) {
    return Response.json({ error: "Email and password are required" }, { status: 400 });
  }

  const existingPrisma = await prisma.user.findUnique({ where: { email } });
  if (existingPrisma) {
    return Response.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const userId = randomUUID();
  const normalizedEmail = email.toLowerCase();

  // Check for a pending invite before creating a personal workspace
  const pendingInvite = await prisma.workspaceInvitation.findFirst({
    where: { email: normalizedEmail, status: "pending", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  let workspaceIdForIntel: string;
  let prismaUser: { id: string; email: string; name: string | null };

  if (pendingInvite) {
    // Join the inviter's workspace instead of creating a personal one
    workspaceIdForIntel = pendingInvite.workspaceId;
    [prismaUser] = await prisma.$transaction([
      prisma.user.create({
        data: { id: userId, email, name: name || null, password: hashed, role: "sales_rep" },
      }),
      prisma.workspaceMember.create({
        data: {
          workspaceId: pendingInvite.workspaceId,
          userId,
          role: pendingInvite.role,
          seatStatus: "active",
        },
      }),
      prisma.workspaceInvitation.update({
        where: { id: pendingInvite.id },
        data: { status: "accepted", acceptedAt: new Date(), acceptedByUserId: userId },
      }),
    ]);
  } else {
    const workspaceId = `ws-${userId}`;
    workspaceIdForIntel = workspaceId;
    // Create the user, their workspace, and their owner membership atomically.
    [prismaUser] = await prisma.$transaction([
      prisma.user.create({
        data: { id: userId, email, name: name || null, password: hashed, role: "owner" },
      }),
      prisma.workspace.create({
        data: {
          id: workspaceId,
          name: companyName || (name ? `${name}'s workspace` : `${email}'s workspace`),
          ownerId: userId,
          plan: "free",
          onboardingStage: "not_started",
        },
      }),
      prisma.workspaceMember.create({
        data: { workspaceId, userId, role: "owner", seatStatus: "active" },
      }),
    ]);
  }

  await fetch(`${INTEL_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Service-Secret": INTEL_SECRET },
    body: JSON.stringify({
      id: userId,
      email,
      password,
      name: name || null,
      company_name: companyName || null,
      workspace_id: workspaceIdForIntel,
    }),
  }).catch(() => {});

  return Response.json({ id: prismaUser.id, email: prismaUser.email, name: prismaUser.name });
}
