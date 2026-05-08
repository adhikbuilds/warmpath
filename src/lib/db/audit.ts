import { prisma } from "@/lib/db/client";

export async function createAuditLog({
  workspaceId,
  actorUserId,
  actorName,
  action,
  entityType,
  entityId,
  entityName,
  metadata,
}: {
  workspaceId: string;
  actorUserId?: string;
  actorName?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      workspaceId,
      actorUserId,
      actorName,
      action,
      entityType,
      entityId,
      entityName,
      metadataJson: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
