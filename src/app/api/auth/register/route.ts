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
  const workspaceId = `ws-${userId}`;

  // Create the user, their workspace, and their owner membership atomically.
  // Without the WorkspaceMember, getWorkspaceId() would fall back to "ws-1" and
  // every request would read/write the wrong (shared) workspace.
  const [prismaUser] = await prisma.$transaction([
    prisma.user.create({
      data: {
        id: userId,
        email,
        name: name || null,
        password: hashed,
        role: "owner",
      },
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
      data: {
        workspaceId,
        userId,
        role: "owner",
        seatStatus: "active",
      },
    }),
  ]);

  await fetch(`${INTEL_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Service-Secret": INTEL_SECRET },
    body: JSON.stringify({
      id: userId,
      email,
      password,
      name: name || null,
      company_name: companyName || null,
      workspace_id: workspaceId,
    }),
  }).catch(() => {});

  return Response.json({ id: prismaUser.id, email: prismaUser.email, name: prismaUser.name });
}
