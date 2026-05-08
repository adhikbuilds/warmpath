import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";

const INTEL_URL = process.env.INTELLIGENCE_SERVICE_URL ?? "http://localhost:8001";

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

  const prismaUser = await prisma.user.create({
    data: {
      id: userId,
      email,
      name: name || null,
      password: hashed,
      role: "owner",
    },
  });

  await fetch(`${INTEL_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
