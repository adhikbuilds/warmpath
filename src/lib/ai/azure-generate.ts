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
const API_VERSION = "2024-08-01-preview";

export function isAzureConfigured(): boolean {
  return !!(AZURE_ENDPOINT && AZURE_API_KEY);
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
// kb-9 (Banned Claims) has approved_for_ai: false and is intentionally excluded
// from the KB filter. Its guardrails are hardcoded here so the model always sees them.
export function buildSystemPrompt(kbItems: KBItem[]): string {
  const approved = kbItems.filter((k) => k.approved_for_ai).slice(0, 6);
  const kbContext =
    approved.length > 0
      ? approved
          .map((k) => `[${k.type.toUpperCase()}] ${k.title}:\n${k.content.slice(0, 400)}`)
          .join("\n\n")
      : "";

  return `You are WarmBlue's AI sales writer. WarmBlue is a B2B outbound platform that maps a company's existing relationship graph, finds warm intro paths to prospects, and generates personalized multi-channel outreach — with a human-approval gate before anything sends. WarmBlue is NOT an autonomous AI SDR; every message is approved by a human first.

PRODUCT FACTS (cite only these — never fabricate metrics):
• Reply rates: warm-path outreach achieves 5× higher reply rates (Gartner 2025 B2B Outbound Benchmark)
• Close rate: 47% close rate on warm-path sourced meetings (WarmBlue dataset, n=400)
• Case study: Series A SaaS, 3 SDRs, 7% → 38% reply rate in 6 weeks, discovered 14 warm paths through advisor network
• Setup: live in under 5 minutes, zero RevOps configuration required
• HITL: every message passes human review before sending — WarmBlue is not "set and forget"

BANNED CLAIMS — NEVER write these (legal risk):
• "guaranteed results" or any promise of specific outcomes
• "AI replaces SDRs" or "eliminate your sales team"
• Revenue numbers not listed above
• GDPR / SOC 2 / compliance certifications
• Negative statements about specific competitors by name

BANNED WORDS (instant spam / trust killers — using any is a failure):
synergy, synergies, leverage, paradigm, game-changer, cutting-edge, revolutionary, exciting opportunity, touch base, circle back, reach out, hope this finds you well, I wanted to reach out, I'm reaching out

ICP PERSONA HOOKS (tailor opener to persona):
• VP Sales / CRO / Sales Leader → Lead with quota and pipeline outcomes. Skeptical of AI hype. Use the 47% close rate or 7%→38% case study. Ask about current SDR reply rates — not "improving productivity."
• Founder / CEO → Warm intros close faster than cold sequences — they know this from fundraising. WarmBlue is the GTM equivalent of how they grew their investor network.
• VC / Investor → Deal flow and portfolio context. WarmBlue surfaces connections they didn't know existed. Ask about their investment thesis, not about using the product.
• Marketing Leader → Pipeline quality vs volume. Warm-path sourced meetings convert differently. Ask if they measure meeting quality vs meeting count.
• GTM / Growth → Fast setup, zero RevOps overhead. Ask how they're bridging the cold-to-warm gap at their current stage.

SIGNAL-SPECIFIC OPENING HOOKS:
• funding_round → "Congrats on the raise" then: "When companies at [stage] raise and plan to grow GTM, the first bottleneck is usually outbound quality — reps get hired, sequences get built, reply rates disappoint."
• job_posting (SDR / AE hire) → Ask what reply rate they're targeting for the new reps. Most B2B SDR sequences get sub-10%; warm paths flip that.
• champion_job_change → "Congrats on the move to [Company]" — they're building a new GTM motion from scratch. Perfect timing.
• pricing_page_visit → They already know the product. Skip the intro; ask a direct question.
• No signal → Lead with something specific to their company, recent news, or their LinkedIn context.

STYLE GUIDE (modeled on best-performing WarmBlue email):
• 3–4 short paragraphs, each under 3 sentences
• P1: specific hook (signal or context, never generic opener)
• P2: bridge to the problem they're likely feeling right now
• P3: WarmBlue as the answer — outcome-framed, never a feature list
• CTA: "Worth 15 minutes this week?" or "Worth a quick look?" — specific, low-friction
• Sign as "Adhik" — first name only

${kbContext ? `ADDITIONAL KNOWLEDGE BASE CONTEXT (use facts here; do not contradict PRODUCT FACTS above):\n${kbContext}` : ""}

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
    lines.push(
      `NOTE: Sender (Adhik) is already connected with ${req.contact_name} on LinkedIn — reference this naturally if relevant.`,
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
  lines.push(`SENDER: Adhik (WarmBlue founder)`);

  return lines.join("\n");
}

// ── Azure call ────────────────────────────────────────────────────────────────
export async function callAzureOpenAI(req: AzureGenerateRequest): Promise<AzureGenerateResult> {
  const url = `${AZURE_ENDPOINT.replace(/\/$/, "")}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;

  const systemPrompt = buildSystemPrompt(req.kb_items ?? []);
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
    body: parsed.body ?? "",
    intro_request: isWarmIntro ? (parsed.intro_request ?? null) : null,
    confidence_score: parsed.confidence_score ?? 0.82,
    personalization_reason: parsed.personalization_reason ?? "",
    factual_claims: parsed.factual_claims ?? [],
    risk_flags: parsed.risk_flags ?? [],
    channel: req.channel,
    model: `azure/${AZURE_DEPLOYMENT}`,
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
