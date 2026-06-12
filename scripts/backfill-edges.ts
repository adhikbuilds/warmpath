// Run with: DATABASE_URL="..." npx ts-node --project tsconfig.json scripts/backfill-edges.ts

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

const BATCH_SIZE = 50;

async function main() {
  console.log("Starting RelationshipEdge backfill...");

  // Fetch all workspaces
  const workspaces = await prisma.workspace.findMany({
    select: { id: true, name: true },
  });

  console.log(`Found ${workspaces.length} workspace(s).`);

  let totalEdgesCreated = 0;
  let totalErrors = 0;

  for (const workspace of workspaces) {
    console.log(`\nWorkspace: ${workspace.name} (${workspace.id})`);

    // Find all users who are members of this workspace
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
      select: {
        userId: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    console.log(`  Members: ${members.length}`);

    let workspaceEdgesCreated = 0;

    for (const member of members) {
      const user = member.user;

      // Find all contacts in this workspace that have no edge FROM this user
      const contactsWithEdge = await prisma.relationshipEdge.findMany({
        where: {
          workspaceId: workspace.id,
          fromId: user.id,
          fromType: "user",
          toType: "contact",
        },
        select: { toId: true },
      });
      const contactIdsWithEdge = new Set(contactsWithEdge.map((e) => e.toId));

      // Get all contacts in workspace
      const contacts = await prisma.contact.findMany({
        where: { workspaceId: workspace.id },
        select: { id: true, name: true },
      });

      const orphanedContacts = contacts.filter((c) => !contactIdsWithEdge.has(c.id));

      if (orphanedContacts.length === 0) {
        console.log(`  User ${user.email ?? user.id}: no orphaned contacts, skipping.`);
        continue;
      }

      console.log(
        `  User ${user.email ?? user.id}: creating edges for ${orphanedContacts.length} orphaned contacts...`,
      );

      const fromName = user.name ?? user.email?.split("@")[0] ?? "Team Member";

      // Create edges in batches of BATCH_SIZE
      for (let i = 0; i < orphanedContacts.length; i += BATCH_SIZE) {
        const batch = orphanedContacts.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(orphanedContacts.length / BATCH_SIZE);

        try {
          const result = await prisma.relationshipEdge.createMany({
            data: batch.map((contact) => ({
              workspaceId: workspace.id,
              fromType: "user",
              fromId: user.id,
              fromName,
              toType: "contact",
              toId: contact.id,
              toName: contact.name,
              relationshipType: "linkedin_connection",
              strengthScore: 35,
              source: "backfill",
            })),
            skipDuplicates: true,
          });
          workspaceEdgesCreated += result.count;
          console.log(
            `    Batch ${batchNum}/${totalBatches}: created ${batch.length} edges (running total: ${workspaceEdgesCreated})`,
          );
        } catch (err) {
          totalErrors += batch.length;
          console.error(
            `    Batch ${batchNum}/${totalBatches}: ERROR creating ${batch.length} edges:`,
            err,
          );
          // Continue with next batch rather than aborting
        }
      }

      totalEdgesCreated += workspaceEdgesCreated;
    }

    console.log(`  Workspace total: ${workspaceEdgesCreated} edges created.`);
  }

  console.log(`\nBackfill complete.`);
  console.log(`  Total edges created: ${totalEdgesCreated}`);
  if (totalErrors > 0) {
    console.log(`  Total errors: ${totalErrors} (see above for details)`);
  }
}

main()
  .catch((err) => {
    console.error("Fatal error during backfill:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
