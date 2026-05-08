import { prisma } from "@/lib/db/client";

export async function getContacts(workspaceId: string, accountId?: string) {
  return prisma.contact.findMany({
    where: { workspaceId, ...(accountId ? { accountId } : {}) },
    orderBy: { warmthScore: "desc" },
  });
}

export async function getContact(workspaceId: string, id: string) {
  return prisma.contact.findFirst({
    where: { id, workspaceId },
    include: { account: true },
  });
}

export async function createContact(
  workspaceId: string,
  data: {
    name: string;
    email?: string;
    title?: string;
    accountId?: string;
    seniority?: string;
    department?: string;
    persona?: string;
  },
) {
  return prisma.contact.create({ data: { workspaceId, ...data } });
}
