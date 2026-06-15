/**
 * Shared Azure OpenAI generation logic used by both:
 *  - /api/ai/azure (direct client-facing route)
 *  - /api/ai/generate-message (Prisma-hydrated warm-leads route)
 *
 * Secrets read from server env only — never passed to the client.
 */

export const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT ?? "";
export const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY ?? "";
export const AZURE_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4.1-nano";
// Stronger model specifically for customer-facing message generation
export const AZURE_DEPLOYMENT_GENERATE =
  process.env.AZURE_OPENAI_DEPLOYMENT_GENERATE ?? "gpt-4.1";
const API_VERSION = "2024-08-01-preview";

export function isAzureConfigured(): boolean {
  return !!(AZURE_ENDPOINT && AZURE_API_KEY);
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/gs, "$1")
    .replace(/\*(.*?)\*/gs, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "• ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

export interface KBItem {
  type: string;
  title: string;
  content: string;
  approved_for_ai: boolean;
}

export interface AzureGenerateRequest {
  contact_name: string;
  contact_title: string;
  contact_department?: string;
  contact_persona?: string;
  account_name: string;
  account_industry: string;
  account_employee_count?: number;
  account_location?: string;
  account_description?: string;
  channel: string;
  tone: string;
  signal_type?: string;
  signal_title?: string;
  signal_description?: string;
  warm_path?: string[];
  intro_person?: string;
  linkedin_connected?: boolean;
  kb_items?: KBItem[];
  sender_name?: string;
  workspace_name?: string;
  /** Optional custom instruction e.g. "make it shorter", "more casual tone" */
  instruction?: string;
  /** When set, rephrase this existing body instead of generating from scratch */
  current_body?: string;
}

export interface AzureGenerateResult {
  subject: string | null;
  body: string;
  intro_request: string | null;
  confidence_score: number;
  personalization_reason: string;
  factual_claims: string[];
  risk_flags: string[];
  channel: string;
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number };
}

// ── System prompt ──────────────────────────────────────────────────────────────
export function buildSystemPrompt(
  kbItems: KBItem[],
  senderName = "Your Rep",
  workspaceName = "our solution",
): string {
  const approved = kbItems.filter((k) => k.approved_for_ai).slice(0, 6);

  // Product/value KB items surface as PRODUCT FACTS; others as additional context.
  const PRODUCT_TYPES = new Set([
    "product_overview",
    "value_proposition",
    "case_study",
    "product",
    "value_prop",
    "pricing",
    "custom",
  ]);
  const productKb = approved.filter((k) => PRODUCT_TYPES.has(k.type));
  const otherKb = approved.filter((k) => !PRODUCT_TYPES.has(k.type));

  const productContext =
    productKb.length > 0
      ? productKb
          .map((k) => `[${k.type.toUpperCase()}] ${k.title}:\n${k.content.slice(0, 500)}`)
          .join("\n\n")
      : "";
  const otherContext =
    otherKb.length > 0
      ? otherKb
          .map((k) => `[${k.type.toUpperCase()}] ${k.title}:\n${k.content.slice(0, 300)}`)
          .join("\n\n")
      : "";

  // Sender line: include company name so the model can write "I'm [name] from [company]"
  const senderLine = `${senderName}${workspaceName ? ` from ${workspaceName}` : ""}`;

  return `You are an AI sales writer for ${workspaceName}. You write concise, personalized B2B outreach messages on behalf of ${senderLine}.
${
  productContext
    ? `\nPRODUCT & COMPANY FACTS (cite only these — never fabricate metrics or outcomes not listed here):\n${productContext}\n`
    : `\nPRODUCT FACTS: None provided. Do NOT invent specific metrics, case studies, or customer names. Focus on the prospect's context and what outcomes they likely care about.\n`
}
BANNED CLAIMS — NEVER write:
• "guaranteed results" or any specific outcome promise not in PRODUCT FACTS
• Claims about revenue, compliance certifications (GDPR / SOC 2), or negative competitor comparisons
• AI as a replacement for humans / "eliminate your team"

BANNED WORDS (instant spam / trust killers — using any is a failure):
synergy, synergies, leverage, paradigm, game-changer, cutting-edge, revolutionary, exciting opportunity, touch base, circle back, reach out, hope this finds you well, I wanted to reach out, I'm reaching out

ICP PERSONA HOOKS (tailor opener to persona):
• VP Sales / CRO / Sales Leader → Lead with quota and pipeline outcomes. Skeptical of AI hype. Ask about their current SDR reply rates, not "improving productivity."
• Founder / CEO → Speed-to-pipeline. Warm intros close faster than cold — they know this from fundraising.
• VC / Investor → Deal flow and portfolio context. Ask about their investment thesis, not about using the product.
• Marketing Leader → Pipeline quality vs volume. Ask if they measure meeting quality vs meeting count.
• GTM / Growth → Fast setup, zero RevOps overhead. Ask how they're bridging the cold-to-warm gap at their current stage.

SIGNAL-SPECIFIC OPENING HOOKS:
• funding_round → "Congrats on the raise" then connect to their likely GTM challenges at this stage
• job_posting (SDR / AE hire) → Ask what reply rate they're targeting for the new reps
• champion_job_change → "Congrats on the move to [Company]" — they're building new GTM from scratch
• pricing_page_visit → They already know the product; skip the intro, ask a direct question
• No signal → Lead with something specific to their company, recent news, or LinkedIn context

STYLE GUIDE:
• 3–4 short paragraphs, each under 3 sentences
• P1: specific hook (signal or context, never a generic opener)
• P2: bridge to the problem they're likely feeling right now
• P3: your solution framed around outcomes, never a feature list
• CTA: "Worth 15 minutes this week?" or "Worth a quick look?" — specific, low-friction
• Sign as "${senderName}" — first name only
${otherContext ? `\nADDITIONAL CONTEXT:\n${otherContext}\n` : ""}
ABSOLUTE FORMAT RULES:
• Email body: under 120 words
• LinkedIn DM: under 300 characters
• End with ONE specific, easy-to-answer question — not "Would you be open to connecting?"
• Subject line (email only): under 8 words, specific to signal/company
  Good: "Congrats on the raise, Vivek" | "Hasura SDRs + warm outbound" | "Shweta — quick intro ask"
  Bad: "Quick question" | "Exciting opportunity" | "Following up"
• Never start subject line with "Quick question"
• Strip pipe-separated taglines from company names: "Acme | India's Best" → "Acme"
• No unfilled placeholders like [COMPANY] or [NAME]
• Plain text only — no markdown, no asterisks, no bullet points in the email body

WARM INTRO channel — two separate outputs:
• "body" = email TO the mutual connection. Must: (a) name the target and their company in line 1, (b) give 1 specific reason this intro makes sense, (c) make it frictionless ("even just a forward would be huge"), (d) end with yes/no question like "Comfortable making the intro?"
• "intro_request" = the forwarded note TO the actual target. Under 3 sentences: WHO you are + what you do, WHY you're reaching out (the signal), and ONE ask.

RESPOND ONLY with valid JSON — no markdown, no code fences:
{
  "subject": "string (email only, null for LinkedIn/warm_intro/WhatsApp)",
  "body": "string (full message body, plain text)",
  "intro_request": "string or null (warm_intro only: the forwarded ask to the target)",
  "confidence_score": number 0.75–0.97,
  "personalization_reason": "string (1 sentence on the key hook used)",
  "factual_claims": ["exact claims made — must match PRODUCT FACTS above verbatim"],
  "risk_flags": []
}`;
}

// ── User prompt ────────────────────────────────────────────────────────────────
export function buildUserPrompt(req: AzureGenerateRequest): string {
  const cleanCompany = req.account_name.split(/[|–—]/)[0].trim();

  const lines = [
    `Write a ${
      req.channel === "warm_intro"
        ? "warm intro request email"
        : req.channel === "linkedin"
          ? "LinkedIn DM (under 300 chars)"
          : "cold email"
    }.`,
    "",
    `CONTACT: ${req.contact_name} | ${req.contact_title}${req.contact_department ? ` | ${req.contact_department}` : ""}`,
    `PERSONA: ${req.contact_persona ?? "B2B decision maker"}`,
    `COMPANY: ${cleanCompany} (${req.account_industry}${req.account_employee_count ? `, ${req.account_employee_count} employees` : ""}${req.account_location ? `, ${req.account_location}` : ""})`,
  ];

  if (req.account_description) {
    lines.push(`COMPANY CONTEXT: ${req.account_description.slice(0, 250)}`);
  }

  if (req.linkedin_connected) {
    const senderFirst = (req.sender_name ?? "the sender").split(" ")[0];
    lines.push(
      `NOTE: ${senderFirst} is already connected with ${req.contact_name} on LinkedIn — reference this naturally if relevant.`,
    );
  }

  if (req.signal_type) {
    lines.push(`BUYING SIGNAL: ${req.signal_type.toUpperCase()} — ${req.signal_title ?? ""}`);
    if (req.signal_description) lines.push(`SIGNAL DETAIL: ${req.signal_description}`);
  }

  if (req.warm_path && req.warm_path.length > 1) {
    lines.push(`WARM PATH: ${req.warm_path.join(" → ")}`);
    if (req.intro_person) lines.push(`INTRO PERSON: ${req.intro_person}`);
  }

  lines.push(`TONE: ${req.tone}`);
  if (req.sender_name) {
    // Include both full name and company so the model can write "I'm [name] from [company]"
    lines.push(
      `SENDER: ${req.sender_name}${req.workspace_name ? ` from ${req.workspace_name}` : ""}`,
    );
  }

  if (req.current_body) {
    lines.push(`\nEXISTING DRAFT TO REPHRASE:\n${req.current_body}`);
  }

  if (req.instruction) {
    lines.push(
      `\nUSER INSTRUCTION: ${req.instruction}${req.current_body ? "\nApply this instruction to the existing draft above." : ""}`,
    );
  }

  return lines.join("\n");
}

// ── Azure call ────────────────────────────────────────────────────────────────
export async function callAzureOpenAI(req: AzureGenerateRequest): Promise<AzureGenerateResult> {
  const url = `${AZURE_ENDPOINT.replace(/\/$/, "")}/openai/deployments/${AZURE_DEPLOYMENT_GENERATE}/chat/completions?api-version=${API_VERSION}`;

  const systemPrompt = buildSystemPrompt(req.kb_items ?? [], req.sender_name, req.workspace_name);
  const userPrompt = buildUserPrompt(req);

  const azureRes = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": AZURE_API_KEY,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 900,
      temperature: 0.72,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!azureRes.ok) {
    const errText = await azureRes.text();
    throw new Error(`Azure OpenAI ${azureRes.status}: ${errText.slice(0, 300)}`);
  }

  const data = (await azureRes.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens: number; completion_tokens: number };
  };

  const content = data.choices?.[0]?.message?.content ?? "{}";
  const usage = data.usage ?? { prompt_tokens: 0, completion_tokens: 0 };

  const parsed = JSON.parse(content) as Partial<AzureGenerateResult>;

  // Enforce channel semantics regardless of model output
  const isWarmIntro = req.channel === "warm_intro";
  const isEmail = req.channel === "email";

  return {
    subject: isEmail ? (parsed.subject ?? null) : null,
    body: stripMarkdown(parsed.body ?? ""),
    intro_request: isWarmIntro ? (parsed.intro_request ?? null) : null,
    confidence_score: parsed.confidence_score ?? 0.82,
    personalization_reason: parsed.personalization_reason ?? "",
    factual_claims: parsed.factual_claims ?? [],
    risk_flags: parsed.risk_flags ?? [],
    channel: req.channel,
    model: `azure/${AZURE_DEPLOYMENT_GENERATE}`,
    usage: {
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
    },
  };
}

// Generic single-turn chat call against the same Azure deployment. Used by
// features that need raw model output (e.g. Network Search ranking) rather than
// the structured message-generation contract above. Returns the content string.
export async function callAzureChat(
  systemPrompt: string,
  userPrompt: string,
  opts?: { jsonObject?: boolean; maxTokens?: number; temperature?: number },
): Promise<string> {
  const url = `${AZURE_ENDPOINT.replace(/\/$/, "")}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;

  const azureRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": AZURE_API_KEY },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: opts?.maxTokens ?? 800,
      temperature: opts?.temperature ?? 0.3,
      ...(opts?.jsonObject ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!azureRes.ok) {
    const errText = await azureRes.text();
    throw new Error(`Azure OpenAI ${azureRes.status}: ${errText.slice(0, 300)}`);
  }

  const data = (await azureRes.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}
