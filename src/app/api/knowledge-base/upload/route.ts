import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";

const ALLOWED_TYPES = new Set(["text/csv", "text/plain", "text/markdown"]);
const CHUNK_SIZE = 800;

function parseSimpleCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(current.trim());
      current = "";
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
    } else {
      current += ch;
    }
  }
  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }
  return rows;
}

function chunkText(text: string, maxChars = CHUNK_SIZE): string[] {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 50);
  const chunks: string[] = [];
  let buf = "";
  for (const para of paragraphs) {
    if (buf.length + para.length > maxChars && buf.length > 0) {
      chunks.push(buf.trim());
      buf = "";
    }
    buf += (buf ? "\n\n" : "") + para;
  }
  if (buf.trim()) chunks.push(buf.trim());
  // If no paragraph structure, just slice
  if (chunks.length === 0) {
    for (let i = 0; i < text.length; i += maxChars) {
      const slice = text.slice(i, i + maxChars).trim();
      if (slice.length > 50) chunks.push(slice);
    }
  }
  return chunks;
}

const VALID_TYPES = new Set([
  "product_overview",
  "case_study",
  "objection_handler",
  "icp_definition",
  "competitor_comparison",
  "value_proposition",
  "product",
  "value_prop",
  "pricing",
  "competitor",
  "objection",
  "icp",
  "persona",
  "playbook",
  "email_example",
  "faq",
  "custom",
]);

export async function POST(req: NextRequest) {
  const { workspaceId } = await getWorkspaceContext();
  if (!workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field is required" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = file.type.toLowerCase();
  const isCsv = ext === "csv" || mime === "text/csv";
  const isText = ext === "txt" || ext === "md" || mime.startsWith("text/");

  if (!isCsv && !isText && !ALLOWED_TYPES.has(mime)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.name}. Use .csv, .txt, or .md` },
      { status: 400 },
    );
  }

  const text = await file.text();
  const errors: string[] = [];
  let created = 0;

  if (isCsv) {
    const rows = parseSimpleCsv(text);
    if (rows.length < 2) {
      return NextResponse.json(
        { error: "CSV must have a header row and at least one data row" },
        { status: 400 },
      );
    }

    // Detect header columns (case-insensitive)
    const header = rows[0].map((h) => h.toLowerCase().replace(/[^a-z_]/g, ""));
    const titleIdx = header.findIndex((h) => h.includes("title") || h.includes("name"));
    const contentIdx = header.findIndex(
      (h) =>
        h.includes("content") ||
        h.includes("body") ||
        h.includes("text") ||
        h.includes("description"),
    );
    const typeIdx = header.findIndex((h) => h.includes("type") || h.includes("category"));
    const tagsIdx = header.findIndex((h) => h.includes("tag"));

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const title =
        titleIdx >= 0 && row[titleIdx]
          ? row[titleIdx]
          : contentIdx >= 0 && row[contentIdx]
            ? `Row ${i}`
            : row[0];
      const content =
        contentIdx >= 0 ? row[contentIdx] : row.filter((_, j) => j !== titleIdx).join(" ");

      if (!title?.trim() || !content?.trim()) {
        errors.push(`Row ${i + 1}: skipped (empty title or content)`);
        continue;
      }

      const rawType = typeIdx >= 0 ? row[typeIdx]?.toLowerCase().replace(/\s+/g, "_") : "custom";
      const itemType = rawType && VALID_TYPES.has(rawType) ? rawType : "custom";
      const rawTags = tagsIdx >= 0 ? row[tagsIdx] : "";
      const tags = rawTags
        ? rawTags
            .split(/[,;]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      try {
        await prisma.knowledgeBaseItem.create({
          data: {
            workspaceId,
            type: itemType,
            title: title.trim().slice(0, 200),
            content: content.trim(),
            tagsJson: JSON.stringify(tags),
            confidenceScore: 0.7,
            approvedForAi: false,
            usedInMessages: 0,
          },
        });
        created++;
      } catch (err) {
        errors.push(`Row ${i + 1}: ${String(err).slice(0, 80)}`);
      }
    }
  } else {
    // TXT / MD — chunk into paragraphs
    const chunks = chunkText(text);
    const baseName = file.name.replace(/\.[^.]+$/, "").slice(0, 80);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const title = chunks.length === 1 ? baseName : `${baseName} (part ${i + 1})`;
      try {
        await prisma.knowledgeBaseItem.create({
          data: {
            workspaceId,
            type: "custom",
            title,
            content: chunk,
            tagsJson: JSON.stringify([]),
            confidenceScore: 0.7,
            approvedForAi: false,
            usedInMessages: 0,
          },
        });
        created++;
      } catch (err) {
        errors.push(`Chunk ${i + 1}: ${String(err).slice(0, 80)}`);
      }
    }
  }

  return NextResponse.json({ created, errors });
}
