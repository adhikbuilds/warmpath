import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

// LinkedIn Connections CSV columns (after LinkedIn's header notes section):
// First Name,Last Name,Email Address,Company,Position,Connected On
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceId();

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
    }

    const text = await (file as File).text();

    // LinkedIn CSV has introductory header lines before the actual data.
    // Find the line that starts the real CSV (contains "First Name").
    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    const headerIdx = lines.findIndex((l) => l.includes("First Name"));
    if (headerIdx === -1) {
      return NextResponse.json({ error: "Invalid LinkedIn CSV format" }, { status: 400 });
    }

    const dataLines = lines.slice(headerIdx + 1).filter((l) => l.trim());

    let imported = 0;
    let skipped = 0;

    for (const line of dataLines) {
      const cols = parseCsvLine(line);
      const firstName = cols[0]?.trim() ?? "";
      const lastName = cols[1]?.trim() ?? "";
      const email = cols[2]?.trim() ?? "";
      const company = cols[3]?.trim() ?? "";
      const position = cols[4]?.trim() ?? "";

      const name = [firstName, lastName].filter(Boolean).join(" ");
      if (!name) {
        skipped++;
        continue;
      }

      let accountId: string | undefined;
      if (company) {
        const existing = await prisma.bizAccount.findFirst({
          where: { workspaceId, name: { equals: company, mode: "insensitive" } },
        });
        if (existing) {
          accountId = existing.id;
        } else {
          const created = await prisma.bizAccount.create({
            data: { workspaceId, name: company, stage: "prospect" },
          });
          accountId = created.id;
        }
      }

      const repName = session.user.name ?? session.user.email?.split("@")[0] ?? "Team Member";
      let newContactId: string | null = null;

      if (email) {
        const existingContact = await prisma.contact.findFirst({
          where: { workspaceId, email },
        });
        if (existingContact) {
          await prisma.contact.update({
            where: { id: existingContact.id },
            data: { name, title: position || existingContact.title, accountId },
          });
        } else {
          const c = await prisma.contact.create({
            data: { workspaceId, name, email, title: position, accountId, warmthScore: 40 },
          });
          newContactId = c.id;
        }
      } else {
        // No email — still create/update by name+company
        const existingContact = company
          ? await prisma.contact.findFirst({
              where: { workspaceId, name, accountId },
            })
          : null;
        if (!existingContact) {
          const c = await prisma.contact.create({
            data: { workspaceId, name, title: position, accountId, warmthScore: 40 },
          });
          newContactId = c.id;
        }
      }

      if (newContactId) {
        // Seed a relationship edge so the graph engine can find this contact
        await prisma.relationshipEdge
          .create({
            data: {
              workspaceId,
              fromType: "user",
              fromId: session.user.id,
              fromName: repName,
              toType: "contact",
              toId: newContactId,
              toName: name,
              relationshipType: "linkedin_connection",
              strengthScore: 50,
              source: "linkedin_csv_import",
            },
          })
          .catch(() => null); // non-fatal
      }

      imported++;
    }

    await prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: session.user.id,
        action: "linkedin_contacts_imported",
        entityType: "integration",
        entityId: "linkedin",
        metadataJson: JSON.stringify({ imported, skipped, total: dataLines.length }),
      },
    });

    return NextResponse.json({ imported, skipped, total: dataLines.length });
  } catch (err) {
    console.error("LinkedIn CSV import error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
