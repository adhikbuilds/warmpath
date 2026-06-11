import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

const ALLOWED_TYPES = new Set(["text/csv", "text/plain", "text/markdown"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const TARGET_CHUNK_MIN = 400;
const TARGET_CHUNK_MAX = 600;

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

/**
 * Split text into chunks targeting TARGET_CHUNK_MIN–TARGET_CHUNK_MAX chars.
 * Strategy: split by paragraph (\n\n), then split long paragraphs by sentence.
 */
function chunkContent(text: string): string[] {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const chunks: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed.length === 0) continue;

    if (trimmed.length <= TARGET_CHUNK_MAX) {
      // Paragraph fits in one chunk; merge with previous if both are small
      const last = chunks[chunks.length - 1];
      if (last && last.length + trimmed.length + 2 <= TARGET_CHUNK_MAX) {
        chunks[chunks.length - 1] = `${last}\n\n${trimmed}`;
      } else {
        chunks.push(trimmed);
      }
    } else {
      // Paragraph too long — split by sentence
      const sentences = trimmed.split(/(?<=[.!?])\s+/);
      let buf = "";
      for (const sentence of sentences) {
        if (buf.length + sentence.length + 1 > TARGET_CHUNK_MAX && buf.length >= TARGET_CHUNK_MIN) {
          chunks.push(buf.trim());
          buf = sentence;
        } else {
          buf = buf ? `${buf} ${sentence}` : sentence;
        }
      }
      if (buf.trim()) chunks.push(buf.trim());
    }
  }

  // Fallback: if no paragraph structure, slice at TARGET_CHUNK_MAX boundaries
  if (chunks.length === 0) {
    for (let i = 0; i < text.length; i += TARGET_CHUNK_MAX) {
      const slice = text.slice(i, i + TARGET_CHUNK_MAX).trim();
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

async function createChunks(workspaceId: string, itemId: string, content: string): Promise<void> {
  const chunks = chunkContent(content);
  await Promise.all(
    chunks.map((chunk, i) =>
      prisma.knowledgeBaseChunk.create({
        data: {
          workspaceId,
          knowledgeBaseItemId: itemId,
          content: chunk,
          metadataJson: JSON.stringify({ chunkIndex: i, totalChunks: chunks.length }),
        },
      }),
    ),
  );
}

export async function POST(req: NextRequest) {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId || workspaceId === "ws-1") {
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

  // File size check — reject files over 5 MB
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum is 5 MB.` },
      { status: 413 },
    );
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
        const item = await prisma.knowledgeBaseItem.create({
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
        await createChunks(workspaceId, item.id, content.trim());
        created++;
      } catch (err) {
        errors.push(`Row ${i + 1}: ${String(err).slice(0, 80)}`);
      }
    }
  } else {
    // TXT / MD — chunk the whole document, create one KBItem per logical chunk
    const chunks = chunkContent(text);
    const baseName = file.name.replace(/\.[^.]+$/, "").slice(0, 80);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const title = chunks.length === 1 ? baseName : `${baseName} (part ${i + 1})`;
      try {
        const item = await prisma.knowledgeBaseItem.create({
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
        // Also create the chunk row so the generation prompt can query it
        await prisma.knowledgeBaseChunk.create({
          data: {
            workspaceId,
            knowledgeBaseItemId: item.id,
            content: chunk,
            metadataJson: JSON.stringify({ chunkIndex: 0, totalChunks: 1 }),
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
