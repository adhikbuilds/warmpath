import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";

type CsvRow = Record<string, string>;

/**
 * Normalise a CSV header to a canonical key.
 * Handles case differences and common variations, e.g.
 *   "Email Address" -> "email", "LinkedInUrl" -> "linkedin_url"
 */
function normaliseHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/url$/, "_url")
    .replace(/address$/, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Map arbitrary CSV column names to our canonical set.
 * Returns a mapping of canonical_key -> header_index.
 */
function buildColumnMap(headers: string[]): Record<string, number> {
  const canonical: Record<string, string[]> = {
    name: ["name", "full_name", "fullname", "contact_name", "first_last"],
    first_name: ["first_name", "firstname", "given_name"],
    last_name: ["last_name", "lastname", "surname", "family_name"],
    email: ["email", "email_address", "emailaddress", "work_email", "personal_email"],
    company: [
      "company",
      "company_name",
      "organization",
      "organisation",
      "employer",
      "account",
      "account_name",
    ],
    title: ["title", "job_title", "jobtitle", "position", "role", "occupation"],
    linkedin_url: [
      "linkedin_url",
      "linkedin",
      "linkedin_profile",
      "profile_url",
      "linkedin_profile_url",
    ],
    phone: ["phone", "phone_number", "phonenumber", "mobile", "telephone", "cell"],
  };

  const result: Record<string, number> = {};
  const normalisedHeaders = headers.map(normaliseHeader);

  for (const [key, aliases] of Object.entries(canonical)) {
    for (let i = 0; i < normalisedHeaders.length; i++) {
      if (aliases.includes(normalisedHeaders[i])) {
        result[key] = i;
        break;
      }
    }
  }
  return result;
}

/** Parse a raw CSV string into an array of row objects. */
function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
  const colMap = buildColumnMap(headers);

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV split — handles quoted fields with commas
    const cells = lines[i].match(/(?:"[^"]*"|[^,])+/g) ?? lines[i].split(",");
    const cleaned = cells.map((c) => c.trim().replace(/^"|"$/g, ""));

    const row: CsvRow = {};
    for (const [key, idx] of Object.entries(colMap)) {
      row[key] = cleaned[idx]?.trim() ?? "";
    }

    // Synthesise 'name' from first_name + last_name if needed
    if (!row.name && (row.first_name || row.last_name)) {
      row.name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
    }

    rows.push(row);
  }
  return rows;
}

type ImportRow = {
  name?: string;
  email?: string;
  company?: string;
  title?: string;
  linkedin_url?: string;
  phone?: string;
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await getWorkspaceContext();
    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 });
    }

    let rows: ImportRow[] = [];
    const errors: string[] = [];

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      // CSV file upload
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file || typeof file === "string") {
        return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
      }
      const text = await (file as Blob).text();
      rows = parseCsv(text) as ImportRow[];
    } else {
      // JSON body with pre-parsed rows
      const body = await req.json().catch(() => null);
      if (!body || !Array.isArray(body.rows)) {
        return NextResponse.json(
          { error: "Expected multipart/form-data with a CSV file, or JSON { rows: [...] }" },
          { status: 400 },
        );
      }
      rows = body.rows as ImportRow[];
    }

    let imported = 0;
    let skipped = 0;
    let edgesFailed = 0;

    // Track emails seen in this batch to deduplicate
    const seenEmails = new Set<string>();

    for (const row of rows) {
      const email = row.email?.trim().toLowerCase();
      if (!email) {
        skipped++;
        errors.push(`Row skipped — no email: ${JSON.stringify(row)}`);
        continue;
      }
      if (seenEmails.has(email)) {
        skipped++;
        continue;
      }
      seenEmails.add(email);

      const name = row.name?.trim() || email.split("@")[0].replace(/[._-]/g, " ");
      const company = row.company?.trim() || undefined;
      const title = row.title?.trim() || undefined;
      const linkedinUrl = row.linkedin_url?.trim() || undefined;

      // Upsert BizAccount if we have a company name
      let accountId: string | undefined;
      if (company) {
        try {
          const existingAccount = await prisma.bizAccount.findFirst({
            where: { workspaceId, name: { equals: company, mode: "insensitive" } },
          });
          if (existingAccount) {
            accountId = existingAccount.id;
          } else {
            const created = await prisma.bizAccount.create({
              data: { workspaceId, name: company, stage: "prospect" },
            });
            accountId = created.id;
          }
        } catch (err) {
          errors.push(`Failed to upsert account "${company}": ${String(err)}`);
        }
      }

      // Upsert Contact by email + workspaceId
      let contactId: string;
      try {
        const existingContact = await prisma.contact.findFirst({
          where: { workspaceId, email },
        });
        if (existingContact) {
          await prisma.contact.update({
            where: { id: existingContact.id },
            data: {
              name,
              title,
              accountId: accountId ?? existingContact.accountId,
              linkedinUrl: linkedinUrl ?? existingContact.linkedinUrl,
            },
          });
          contactId = existingContact.id;
        } else {
          const created = await prisma.contact.create({
            data: {
              workspaceId,
              name,
              email,
              title,
              accountId,
              linkedinUrl,
              warmthScore: 30,
            },
          });
          contactId = created.id;
        }
      } catch (err) {
        errors.push(`Failed to upsert contact "${email}": ${String(err)}`);
        skipped++;
        continue;
      }

      // Create RelationshipEdge (user -> contact) if one doesn't exist yet
      try {
        const existingEdge = await prisma.relationshipEdge.findFirst({
          where: { workspaceId, fromId: session.user.id, toId: contactId },
        });
        if (!existingEdge) {
          await prisma.relationshipEdge.create({
            data: {
              workspaceId,
              fromType: "user",
              fromId: session.user.id,
              fromName: session.user.name ?? session.user.email?.split("@")[0] ?? "Team Member",
              toType: "contact",
              toId: contactId,
              toName: name,
              relationshipType: "linkedin_connection",
              strengthScore: 40,
              source: "csv_import",
            },
          });
        }
      } catch (edgeErr) {
        edgesFailed++;
        console.error(
          `[discovery-import] Failed to create edge for contact ${contactId} (${email}):`,
          edgeErr,
        );
      }

      imported++;
    }

    // Audit log (non-fatal)
    await prisma.auditLog
      .create({
        data: {
          workspaceId,
          actorUserId: session.user.id,
          action: "discovery_import",
          entityType: "integration",
          entityId: "csv",
          metadataJson: JSON.stringify({
            imported,
            skipped,
            edgesFailed,
            total: rows.length,
          }),
        },
      })
      .catch((err) => console.error("[discovery-import] Audit log failed:", err));

    return NextResponse.json({
      imported,
      skipped,
      edgesFailed,
      errors: errors.slice(0, 20), // cap errors to avoid huge payloads
    });
  } catch (err) {
    console.error("Discovery import error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
