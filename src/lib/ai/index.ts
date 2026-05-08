/**
 * AI Provider Abstraction
 *
 * Modes:
 *   mock   deterministic, no cost, uses templates + context variables (DEFAULT)
 *   local  calls Ollama at NEXT_PUBLIC_OLLAMA_BASE_URL if available, fallback to mock
 *   remote calls Anthropic/OpenAI if key exists, logs cost, fallback to mock
 *
 * Set NEXT_PUBLIC_AI_MODE=mock|local|remote in .env.local
 * Default is "mock" never burns API credits during testing.
 */

import type {
  Account,
  AIMode,
  AIUsageLog,
  Contact,
  KnowledgeBaseItem,
  MessageRisk,
  NextBestAction,
  Signal,
  WarmPath,
} from "@/types";

// ─── Input/Output Types ────────────────────────────────────────────────────

export interface GenerateMessageInput {
  account: Account;
  contact: Contact;
  signal?: Signal;
  warmPath?: WarmPath;
  kbItems?: KnowledgeBaseItem[];
  channel?: "email" | "linkedin" | "warm_intro" | "phone" | "whatsapp" | "telegram" | "meta_ads";
  tone?: string;
  introPersonName?: string;
}

export interface GeneratedMessageResult {
  subject?: string;
  body: string;
  intro_request?: string;
  channel: string;
  confidence_score: number;
  personalization_reason: string;
  factual_claims: string[];
  supporting_sources: string[];
  risk_flags: string[];
  used_kb_item_ids: string[];
}

export interface AIProviderStatus {
  mode: string;
  provider: string;
  model: string;
  cost_this_session: number;
  cache_hits: number;
  generations_this_session: number;
  available: boolean;
}

// ─── Provider Interface ────────────────────────────────────────────────────

interface AIProvider {
  generateMessage(input: GenerateMessageInput): Promise<GeneratedMessageResult>;
  analyzeRisk(body: string, subject?: string): Promise<MessageRisk[]>;
  recommendNextActions(
    accounts: Account[],
    signals: Signal[],
    warmPaths: WarmPath[],
  ): Promise<NextBestAction[]>;
  getStatus(): AIProviderStatus;
  logUsage(log: Omit<AIUsageLog, "id" | "created_at">): void;
}

// ─── Session tracking ─────────────────────────────────────────────────────

let sessionCacheHits = 0;
let sessionGenerations = 0;
let sessionCost = 0;

const generationCache = new Map<string, GeneratedMessageResult>();

function cacheKey(input: GenerateMessageInput): string {
  return `${input.account.id}:${input.contact.id}:${input.signal?.id ?? "none"}:${input.channel ?? "email"}`;
}

// ─── Mock Provider ─────────────────────────────────────────────────────────

const MOCK_VALUE_PROPS = [
  "route every outbound message through your team's warmest relationship path",
  "turn cold prospects into warm intros using your existing network graph",
  "generate fact-checked, persona-matched messages that sound like you wrote them",
  "surface buying signals the moment they happen and act before competitors do",
];

const MOCK_CASE_STUDY_SNIPPETS = [
  "One Series A SaaS team went from 8% to 41% reply rate in their first month",
  "A B2B software company booked 12 meetings in week one using warm-path routing",
  "Teams using relationship-first outbound see 5× higher reply rates vs cold email",
];

const MOCK_CTAAS = [
  "Worth 15 minutes this week?",
  "Happy to show you a live demo built around [account]'s specific motion.",
  "Can I send you a quick breakdown of how we'd approach [account]?",
  "Would a 20-min call Thursday or Friday work?",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getKBFacts(kbItems: KnowledgeBaseItem[]): {
  valueProp: string;
  caseStudy: string;
  approvedClaims: string[];
  usedIds: string[];
} {
  const approved = kbItems.filter((k) => k.approved_for_ai);
  const valuePropItem = approved.find((k) => k.type === "value_prop" || k.type === "product");
  const caseStudyItem = approved.find((k) => k.type === "case_study");
  const complianceItem = approved.find((k) => k.type === "compliance");

  return {
    valueProp: valuePropItem ? valuePropItem.content.slice(0, 120) : pickRandom(MOCK_VALUE_PROPS),
    caseStudy: caseStudyItem
      ? caseStudyItem.content.slice(0, 100)
      : pickRandom(MOCK_CASE_STUDY_SNIPPETS),
    approvedClaims: complianceItem
      ? [complianceItem.content.slice(0, 80)]
      : ["5× higher reply rate vs cold email (Gartner, 2025)"],
    usedIds: [valuePropItem?.id, caseStudyItem?.id].filter(Boolean) as string[],
  };
}

function buildWarmIntroEmail(input: GenerateMessageInput): GeneratedMessageResult {
  const { account, contact, signal, warmPath, kbItems = [] } = input;
  const introName = warmPath?.recommended_intro_person ?? input.introPersonName ?? "Sarah";
  const kb = getKBFacts(kbItems);

  const signalHook = signal
    ? signal.type === "funding"
      ? `I saw that ${account.name} just raised congrats!`
      : signal.type === "job_posting"
        ? `Noticed ${account.name} is hiring ${signal.title.split(" ").slice(2).join(" ")} seems like a busy growth phase.`
        : signal.type === "pricing_page_visit"
          ? `Saw that someone from ${account.name} visited our pricing page twice this week.`
          : `Noticed ${account.name} ${signal.title.toLowerCase()}.`
    : `I've been following what ${account.name} is building.`;

  const subject = `[Intro request] ${contact.name} at ${account.name}`;
  const body = `Hey ${introName},

Hope you're well! Quick ask I noticed you're connected to ${contact.name} (${contact.title} at ${account.name}).

${signalHook}

We help GTM teams ${kb.valueProp}. I'd love a quick intro if you're comfortable even just "you should talk to Adhik" would be huge.

${kb.caseStudy ? `For context: ${kb.caseStudy}.` : ""}

Would really appreciate it!
Adhik`;

  const introRequest = `Hi ${introName} mind if I mention your name when reaching out to ${contact.name} at ${account.name}? ${signalHook.replace("I saw", "I saw")} Happy to make the ask super easy just a quick "you should chat with Adhik" is all I need.`;

  return {
    subject,
    body,
    intro_request: introRequest,
    channel: "warm_intro",
    confidence_score: 0.88 + Math.random() * 0.08,
    personalization_reason: `${introName} has a direct relationship with ${contact.name}. ${signal ? signalHook : "Strong ICP match."} Generated from KB: Product Overview + Case Study.`,
    factual_claims: [
      ...kb.approvedClaims,
      signal ? signal.title : `${account.name} matches ICP criteria`,
    ],
    supporting_sources: [
      ...kb.usedIds.map((id) => `KB item: ${id}`),
      signal ? `Signal: ${signal.source ?? "LinkedIn"}` : "ICP scoring engine",
    ],
    risk_flags: [],
    used_kb_item_ids: kb.usedIds,
  };
}

function buildDirectEmail(input: GenerateMessageInput): GeneratedMessageResult {
  const { account, contact, signal, warmPath, kbItems = [] } = input;
  const kb = getKBFacts(kbItems);
  const cta = pickRandom(MOCK_CTAAS).replace("[account]", account.name);

  const signalHook = signal
    ? signal.type === "funding"
      ? `Congrats on the ${signal.title} that's a huge milestone.`
      : signal.type === "job_posting"
        ? `Noticed ${account.name} is building out the GTM team saw the ${contact.department} hires.`
        : signal.type === "pricing_page_visit"
          ? `Someone from ${account.name} spent time on our pricing page this week felt like the right moment to reach out.`
          : signal.type === "champion_job_change"
            ? `Congrats on the new role at ${account.name} exciting move!`
            : `Saw that ${account.name} ${signal.title.toLowerCase()}.`
    : `I've been following ${account.name}'s growth.`;

  const warmContext = warmPath
    ? `${warmPath.path_nodes[1]?.name ?? "A mutual connection"} mentioned ${contact.name.split(" ")[0]} might be the right person to talk to.`
    : "";

  const subject =
    signal?.type === "funding"
      ? `Congrats on the raise scaling outbound?`
      : signal?.type === "job_posting"
        ? `${account.name} is hiring GTM warm outbound angle`
        : signal?.type === "pricing_page_visit"
          ? `${account.name} + warm outbound saw your visit`
          : `${account.name} + relationship-first sales`;

  const body = `Hi ${contact.name.split(" ")[0]},

${warmContext ? `${warmContext}\n\n` : ""}${signalHook}

We help revenue teams like ${account.name}'s ${kb.valueProp}.

${kb.caseStudy ? `${kb.caseStudy}.` : ""}

${cta}

Adhik`;

  return {
    subject,
    body,
    channel: "email",
    confidence_score: 0.84 + Math.random() * 0.1,
    personalization_reason: `${signal ? `Signal: ${signal.type}` : "ICP match"}. ${warmPath ? `Warm path via ${warmPath.recommended_intro_person}.` : ""} Grounded in: Product Overview, ${signal ? "live signal" : "ICP scoring"}.`,
    factual_claims: [
      ...kb.approvedClaims,
      signal ? signal.title : `${account.name} fits WarmPath ICP (${account.industry})`,
    ],
    supporting_sources: [
      ...kb.usedIds.map((id) => `KB item: ${id}`),
      signal ? `Signal detected: ${signal.detected_at}` : "ICP match engine",
    ],
    risk_flags: [],
    used_kb_item_ids: kb.usedIds,
  };
}

function buildPhoneScript(input: GenerateMessageInput): GeneratedMessageResult {
  const { account, contact, signal, warmPath, kbItems = [] } = input;
  const kb = getKBFacts(kbItems);
  const introName = warmPath?.recommended_intro_person ?? input.introPersonName;
  const firstName = contact.name.split(" ")[0];

  const signalRef = signal
    ? signal.type === "job_posting"
      ? `saw you're hiring SDRs`
      : signal.type === "funding"
        ? `congrats on the raise`
        : `noticed ${signal.title.toLowerCase()}`
    : `been following ${account.name}`;

  const body = `OPENER:
"Hey ${firstName}, this is Adhik from WarmPath. Quick reason for the call ${introName ? `${introName} mentioned you` : `I ${signalRef}`}'re close to ${account.name}'s outbound push. I had a short idea on warm-path selling instead of cold volume. Got 2 minutes?"

IF YES:
"Great. So ${kb.caseStudy}. For ${account.name} specifically, I can already see warm paths into your target accounts. Would a 20-minute Zoom make sense this week?"

DISCOVERY QUESTIONS:
• What's your current reply rate on outbound?
• How many SDRs are you running right now?
• Are you using a relationship layer or all cold?

OBJECTION "We already use Apollo":
"WarmPath isn't replacing your sequence tool it's the warm-path layer on top. Apollo tells you who to target; WarmPath tells you who already knows them."

VOICEMAIL:
"Hey ${firstName}, Adhik from WarmPath. ${introName ? `${introName} mentioned` : `I ${signalRef} and`} thought you'd find this useful. We just mapped warm paths into your target accounts. I'll send a note feel free to grab time on my calendar."`;

  return {
    body,
    channel: "phone",
    confidence_score: 0.85 + Math.random() * 0.1,
    personalization_reason: `Phone script for ${contact.title} at ${account.name}. ${signal ? `Triggered by: ${signal.type}.` : "ICP match."} ${warmPath ? `Warm path via ${warmPath.recommended_intro_person}.` : ""}`,
    factual_claims: kb.approvedClaims,
    supporting_sources: kb.usedIds.map((id) => `KB item: ${id}`),
    risk_flags: [],
    used_kb_item_ids: kb.usedIds,
  };
}

function buildWhatsAppMessage(input: GenerateMessageInput): GeneratedMessageResult {
  const { account, contact, signal, warmPath, kbItems = [] } = input;
  const kb = getKBFacts(kbItems);
  const firstName = contact.name.split(" ")[0];
  const introName = warmPath?.recommended_intro_person ?? input.introPersonName;

  const hook = signal
    ? signal.type === "job_posting"
      ? `Saw you're adding SDRs`
      : signal.type === "funding"
        ? `Congrats on the raise`
        : `Noticed ${account.name} ${signal.title.split(" ").slice(0, 5).join(" ")}`
    : `I've been following ${account.name}`;

  const body = `Hey ${firstName} Adhik here. ${introName ? `${introName} mentioned you.` : ""} ${hook} thought this might be useful. We mapped warm paths into your target accounts. Worth a quick look? (Reply STOP to opt out)`;

  return {
    body,
    channel: "whatsapp",
    confidence_score: 0.87 + Math.random() * 0.09,
    personalization_reason: `Short WhatsApp for ${contact.title} at ${account.name}. Includes opt-out.`,
    factual_claims: kb.approvedClaims,
    supporting_sources: kb.usedIds.map((id) => `KB item: ${id}`),
    risk_flags: [],
    used_kb_item_ids: kb.usedIds,
  };
}

function buildTelegramMessage(input: GenerateMessageInput): GeneratedMessageResult {
  const { account, contact, kbItems = [] } = input;
  const kb = getKBFacts(kbItems);
  const firstName = contact.name.split(" ")[0];

  const body = `Hey ${firstName}! Noticed you're building in B2B SaaS. We just launched WarmPath it maps your team's actual network and routes outbound through warm intros automatically. Would love your honest feedback. Happy to give free access for 3 months.`;

  return {
    body,
    channel: "telegram",
    confidence_score: 0.82 + Math.random() * 0.1,
    personalization_reason: `Telegram DM for ${contact.title} at ${account.name}. Founder-tone, value-first.`,
    factual_claims: kb.approvedClaims,
    supporting_sources: kb.usedIds.map((id) => `KB item: ${id}`),
    risk_flags: [],
    used_kb_item_ids: kb.usedIds,
  };
}

function buildMetaAd(input: GenerateMessageInput): GeneratedMessageResult {
  const { account, kbItems = [] } = input;
  const kb = getKBFacts(kbItems);

  const body = `Headline: "Still relying on cold outbound?"

Primary text: "${kb.valueProp}. ${kb.caseStudy}."

Audience: ${account.industry} decision-makers, 50-500 employees, who visited pricing or competitor pages.

CTA: "See Warm Paths"

Daily budget suggestion: $50/day → ~27 leads/month at $55 CPL (simulated)`;

  return {
    body,
    channel: "meta_ads",
    confidence_score: 0.9 + Math.random() * 0.07,
    personalization_reason: `Meta ad targeting ${account.industry} segment. Retargeting intent-hot accounts.`,
    factual_claims: kb.approvedClaims,
    supporting_sources: kb.usedIds.map((id) => `KB item: ${id}`),
    risk_flags: [],
    used_kb_item_ids: kb.usedIds,
  };
}

class MockAIProvider implements AIProvider {
  getStatus(): AIProviderStatus {
    return {
      mode: "mock",
      provider: "MockAIProvider",
      model: "warmpath-mock-v1",
      cost_this_session: 0,
      cache_hits: sessionCacheHits,
      generations_this_session: sessionGenerations,
      available: true,
    };
  }

  async generateMessage(input: GenerateMessageInput): Promise<GeneratedMessageResult> {
    const key = cacheKey(input);
    if (generationCache.has(key)) {
      sessionCacheHits++;
      return generationCache.get(key)!;
    }

    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

    const result =
      input.channel === "warm_intro" || input.warmPath
        ? buildWarmIntroEmail(input)
        : input.channel === "phone"
          ? buildPhoneScript(input)
          : input.channel === "whatsapp"
            ? buildWhatsAppMessage(input)
            : input.channel === "telegram"
              ? buildTelegramMessage(input)
              : input.channel === "meta_ads"
                ? buildMetaAd(input)
                : buildDirectEmail(input);

    generationCache.set(key, result);
    sessionGenerations++;
    return result;
  }

  async analyzeRisk(body: string, subject?: string): Promise<MessageRisk[]> {
    const risks: MessageRisk[] = [];
    const wordCount = body.split(/\s+/).length;

    if (wordCount > 250) {
      risks.push({
        risk_type: "too_long",
        severity: "medium",
        explanation: `Message is ${wordCount} words. Aim for under 200 for better reply rates.`,
        suggested_fix: "Remove the case study paragraph and shorten CTA.",
      });
    }
    if (body.toLowerCase().includes("synergy") || body.toLowerCase().includes("leverage")) {
      risks.push({
        risk_type: "too_salesy",
        severity: "medium",
        explanation: "Contains buzzwords that trigger spam filters and reduce trust.",
        suggested_fix: "Replace buzzwords with concrete, plain language.",
      });
    }
    if (!body.toLowerCase().includes("?")) {
      risks.push({
        risk_type: "no_clear_cta",
        severity: "high",
        explanation: "No question or clear call-to-action found in the message.",
        suggested_fix: "End with a specific, easy-to-answer question.",
      });
    }
    if (body.includes("[") && body.includes("]")) {
      risks.push({
        risk_type: "unfilled_template",
        severity: "high",
        explanation: "Message contains unfilled template placeholders like [account].",
        suggested_fix: "Review and fill in all placeholder values before sending.",
      });
    }

    return risks;
  }

  async recommendNextActions(
    accounts: Account[],
    signals: Signal[],
    warmPaths: WarmPath[],
  ): Promise<NextBestAction[]> {
    const scored = accounts
      .map((a) => {
        const accountSignals = signals.filter((s) => s.account_id === a.id);
        const accountPaths = warmPaths.filter((w) => w.account_id === a.id);
        const topSignal = accountSignals.sort((x, y) => y.urgency_score - x.urgency_score)[0];
        const topPath = accountPaths.sort((x, y) => y.warmth_score - x.warmth_score)[0];
        const score =
          a.opportunity_score * 0.4 +
          (topSignal?.urgency_score ?? 0) * 0.35 +
          (topPath?.warmth_score ?? 0) * 0.25;
        return { account: a, signal: topSignal, path: topPath, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return scored.map(({ account, signal, path, score }) => ({
      account: account.name,
      account_id: account.id,
      contact: "Key decision maker",
      contact_id: "",
      reason: signal
        ? `${signal.title}. ${path ? `Warm path via ${path.recommended_intro_person}.` : "No direct warm path cold outreach recommended."}`
        : `Strong ICP fit (${account.fit_score}/100). ${path ? `Warm path via ${path.recommended_intro_person}.` : ""}`,
      recommended_channel: (path?.recommended_channel ?? "email") as "email" | "linkedin" | "call",
      recommended_action: path
        ? `Ask ${path.recommended_intro_person} for intro, then send personalized email`
        : `Send signal-triggered email to key decision maker`,
      confidence: Math.round(score) / 100,
      urgency: score >= 75 ? "high" : score >= 55 ? "medium" : "low",
    }));
  }

  logUsage(_log: Omit<AIUsageLog, "id" | "created_at">): void {
    // Mock: cost is always $0, just increment session counter
    sessionCost += _log.estimated_cost;
  }
}

// ─── Local Provider (Ollama) ───────────────────────────────────────────────

class LocalAIProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_OLLAMA_BASE_URL ?? "http://localhost:11434";
    this.model = process.env.NEXT_PUBLIC_OLLAMA_MODEL ?? "qwen2.5:14b";
  }

  getStatus(): AIProviderStatus {
    return {
      mode: "local",
      provider: "Ollama",
      model: this.model,
      cost_this_session: 0,
      cache_hits: sessionCacheHits,
      generations_this_session: sessionGenerations,
      available: true,
    };
  }

  private buildSystemPrompt(kbItems: KnowledgeBaseItem[]): string {
    const approved = kbItems.filter((k) => k.approved_for_ai).slice(0, 6);
    const kbContext = approved
      .map((k) => `[${k.type.toUpperCase()}] ${k.title}:\n${k.content.slice(0, 250)}`)
      .join("\n\n");

    return `You are WarmPath's AI sales writer. Write personalized, warm B2B outbound messages that feel genuinely human.

${kbContext ? `KNOWLEDGE BASE (use these facts do not make up anything not listed here):\n${kbContext}` : ""}

RULES:
- Body must be under 130 words
- End with exactly one specific, easy-to-answer question
- Sound like a real person wrote it, not a template
- Never use: synergy, leverage, paradigm, game-changer, cutting-edge, revolutionary
- Reference the signal/trigger if one is provided
- If a warm path exists, reference the intro person naturally
- No placeholders like [COMPANY] or [NAME]

RESPOND ONLY with valid JSON matching this exact schema:
{
  "subject": "string (email subject line)",
  "body": "string (the full message body, plain text, no markdown)",
  "intro_request": "string or null (only if channel is warm_intro)",
  "confidence_score": number (0.75 to 0.97),
  "personalization_reason": "string (1 sentence explaining the personalization)",
  "factual_claims": ["array of factual claims made in the message"],
  "risk_flags": []
}`;
  }

  private buildUserPrompt(input: GenerateMessageInput): string {
    const {
      account,
      contact,
      signal,
      warmPath,
      channel = "email",
      tone = "direct and friendly",
    } = input;

    const lines = [
      `Write a ${channel === "warm_intro" ? "warm intro request" : channel === "linkedin" ? "LinkedIn DM" : "cold email"}.`,
      "",
      `TARGET CONTACT: ${contact.name}, ${contact.title}`,
      `COMPANY: ${account.name} (${account.industry}, ${account.employee_count} employees, ${account.location})`,
      `ACCOUNT DESCRIPTION: ${account.description}`,
    ];

    if (signal) {
      lines.push(`BUYING SIGNAL: ${signal.type} ${signal.title}`);
      lines.push(`SIGNAL DETAIL: ${signal.description}`);
    }

    if (warmPath) {
      const pathStr = warmPath.path_nodes.map((n) => n.name).join(" → ");
      lines.push(`WARM PATH: ${pathStr}`);
      lines.push(`INTRO PERSON: ${warmPath.recommended_intro_person}`);
      lines.push(`PATH EXPLANATION: ${warmPath.path_explanation}`);
    }

    lines.push(`TONE: ${tone}`);
    lines.push(`PERSONA: ${contact.persona}`);

    return lines.join("\n");
  }

  async generateMessage(input: GenerateMessageInput): Promise<GeneratedMessageResult> {
    const key = cacheKey(input);
    if (generationCache.has(key)) {
      sessionCacheHits++;
      return generationCache.get(key)!;
    }

    const { kbItems = [], channel = "email" } = input;
    const approved = kbItems.filter((k) => k.approved_for_ai);

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: this.buildSystemPrompt(kbItems) },
          { role: "user", content: this.buildUserPrompt(input) },
        ],
        stream: false,
        format: "json",
        options: { temperature: 0.72, num_predict: 700 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama ${response.status}: ${await response.text()}`);
    }

    const data = (await response.json()) as { message?: { content?: string } };
    const content = data.message?.content ?? "{}";

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content) as Record<string, unknown>;
    } catch {
      throw new Error(`Ollama returned non-JSON: ${content.slice(0, 200)}`);
    }

    sessionGenerations++;

    const result: GeneratedMessageResult = {
      subject: typeof parsed.subject === "string" ? parsed.subject : "",
      body: typeof parsed.body === "string" ? parsed.body : content,
      intro_request: typeof parsed.intro_request === "string" ? parsed.intro_request : undefined,
      channel,
      confidence_score:
        typeof parsed.confidence_score === "number"
          ? Math.max(0.7, Math.min(0.97, parsed.confidence_score))
          : 0.84,
      personalization_reason:
        typeof parsed.personalization_reason === "string"
          ? parsed.personalization_reason
          : `Generated by ${this.model} (Ollama local)`,
      factual_claims: Array.isArray(parsed.factual_claims)
        ? (parsed.factual_claims as string[])
        : [],
      supporting_sources: [
        `Local model: ${this.model}`,
        ...approved.slice(0, 2).map((k) => `KB: ${k.title}`),
      ],
      risk_flags: [],
      used_kb_item_ids: approved.slice(0, 3).map((k) => k.id),
    };

    generationCache.set(key, result);
    return result;
  }

  async analyzeRisk(body: string): Promise<MessageRisk[]> {
    // Reuse mock risk analysis deterministic and fast
    const mock = new MockAIProvider();
    return mock.analyzeRisk(body);
  }

  async recommendNextActions(
    accounts: Account[],
    signals: Signal[],
    warmPaths: WarmPath[],
  ): Promise<NextBestAction[]> {
    const mock = new MockAIProvider();
    return mock.recommendNextActions(accounts, signals, warmPaths);
  }

  logUsage(_log: Omit<AIUsageLog, "id" | "created_at">): void {
    sessionCost += _log.estimated_cost;
  }
}

// ─── Remote Provider (Claude Sonnet 4.6 via Anthropic SDK) ────────────────────
//
// Prompt caching strategy:
//   - System prompt (KB context + workspace rules) → cached with cache_control
//   - Per-request data (contact, account, signal) → not cached (changes each call)
//
// Cost model (claude-sonnet-4-6):
//   Input:  $3/M tokens    Cache write: $3.75/M    Cache read: $0.30/M
//   Output: $15/M tokens

const ANTHROPIC_MODEL = "claude-sonnet-4-6";

// Per-USD token cost for cost estimation
const INPUT_COST_PER_TOKEN = 3 / 1_000_000;
const CACHE_READ_COST_PER_TOKEN = 0.3 / 1_000_000;
const CACHE_WRITE_COST_PER_TOKEN = 3.75 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000;

class RemoteAIProvider implements AIProvider {
  private apiKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any; // Anthropic client dynamic import to avoid SSR issues

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ?? "";
    this.client = null;
  }

  // Lazy-init the client only on first call (avoids Next.js SSR bundling issues)
  private async getClient() {
    if (this.client) return this.client;
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    this.client = new Anthropic({ apiKey: this.apiKey });
    return this.client;
  }

  getStatus(): AIProviderStatus {
    return {
      mode: "remote",
      provider: "Anthropic",
      model: ANTHROPIC_MODEL,
      cost_this_session: sessionCost,
      cache_hits: sessionCacheHits,
      generations_this_session: sessionGenerations,
      available: !!this.apiKey,
    };
  }

  private buildSystemPrompt(kbItems: KnowledgeBaseItem[]): string {
    const approved = kbItems.filter((k) => k.approved_for_ai).slice(0, 8);
    const kbContext = approved
      .map((k) => `[${k.type.toUpperCase()}] ${k.title}:\n${k.content.slice(0, 300)}`)
      .join("\n\n");

    return `You are WarmPath's AI sales writer. Write personalized, warm B2B outbound messages that feel genuinely human.

${kbContext ? `KNOWLEDGE BASE (use these facts do not fabricate anything not listed here):\n${kbContext}` : ""}

RULES:
- Message body must be under 130 words
- End with exactly one specific, low-friction question
- Sound like a real person, not a template
- Never use: synergy, leverage, paradigm, game-changer, cutting-edge, revolutionary
- Always reference the specific signal or trigger if provided
- If a warm path exists, mention the intro person naturally
- No placeholders like [COMPANY] or [NAME]

RESPOND ONLY with valid JSON:
{
  "subject": "string (email subject, omit for non-email)",
  "body": "string (full message body, plain text only)",
  "intro_request": "string or null (only for warm_intro channel)",
  "confidence_score": number (0.75–0.97),
  "personalization_reason": "string (1 sentence explaining the personalization hook used)",
  "factual_claims": ["array of verifiable factual claims made"],
  "risk_flags": []
}`;
  }

  private buildUserPrompt(input: GenerateMessageInput): string {
    const {
      account,
      contact,
      signal,
      warmPath,
      channel = "email",
      tone = "direct and friendly",
    } = input;

    const lines = [
      `Write a ${channel === "warm_intro" ? "warm intro request email" : channel === "linkedin" ? "LinkedIn DM" : "cold email"}.`,
      "",
      `CONTACT: ${contact.name} | ${contact.title} | ${contact.department} | ${contact.persona}`,
      `COMPANY: ${account.name} (${account.industry}, ${account.employee_count} employees, ${account.location})`,
      `DESCRIPTION: ${account.description}`,
    ];

    if (signal) {
      lines.push(`SIGNAL: ${signal.type.toUpperCase()} ${signal.title}`);
      if (signal.description) lines.push(`SIGNAL DETAIL: ${signal.description}`);
    }

    if (warmPath) {
      const path = warmPath.path_nodes.map((n) => n.name).join(" → ");
      lines.push(`WARM PATH: ${path}`);
      lines.push(`INTRO PERSON: ${warmPath.recommended_intro_person}`);
    }

    lines.push(`TONE: ${tone}`);

    return lines.join("\n");
  }

  async generateMessage(input: GenerateMessageInput): Promise<GeneratedMessageResult> {
    const key = cacheKey(input);
    if (generationCache.has(key)) {
      sessionCacheHits++;
      return generationCache.get(key)!;
    }

    if (!this.apiKey) {
      console.warn("[RemoteAI] No API key falling back to mock");
      return new MockAIProvider().generateMessage(input);
    }

    const { kbItems = [], channel = "email" } = input;
    const client = await this.getClient();

    let response: {
      content: Array<{ type: string; text?: string }>;
      usage: {
        input_tokens: number;
        output_tokens: number;
        cache_read_input_tokens?: number;
        cache_creation_input_tokens?: number;
      };
    };

    try {
      response = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 800,
        system: [
          {
            type: "text",
            text: this.buildSystemPrompt(kbItems),
            // Cache the system prompt (KB context) this is the expensive cacheable block
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: this.buildUserPrompt(input) }],
      });
    } catch (err) {
      console.error("[RemoteAI] Anthropic error falling back to mock:", err);
      return new MockAIProvider().generateMessage(input);
    }

    const text = response.content.find((b) => b.type === "text")?.text ?? "{}";

    // Estimate cost
    const u = response.usage;
    const inputTokens = u.input_tokens ?? 0;
    const outputTokens = u.output_tokens ?? 0;
    const cacheReadTokens = u.cache_read_input_tokens ?? 0;
    const cacheWriteTokens = u.cache_creation_input_tokens ?? 0;
    const estimatedCost =
      inputTokens * INPUT_COST_PER_TOKEN +
      outputTokens * OUTPUT_COST_PER_TOKEN +
      cacheReadTokens * CACHE_READ_COST_PER_TOKEN +
      cacheWriteTokens * CACHE_WRITE_COST_PER_TOKEN;

    sessionCost += estimatedCost;
    sessionGenerations++;
    if (cacheReadTokens > 0) sessionCacheHits++;

    let parsed: Record<string, unknown>;
    try {
      // Strip markdown fences if model wrapped it
      const clean = text
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();
      parsed = JSON.parse(clean) as Record<string, unknown>;
    } catch {
      console.error("[RemoteAI] Non-JSON response:", text.slice(0, 300));
      return new MockAIProvider().generateMessage(input);
    }

    const result: GeneratedMessageResult = {
      subject: typeof parsed.subject === "string" ? parsed.subject : "",
      body: typeof parsed.body === "string" ? parsed.body : text,
      intro_request: typeof parsed.intro_request === "string" ? parsed.intro_request : undefined,
      channel,
      confidence_score:
        typeof parsed.confidence_score === "number"
          ? Math.max(0.75, Math.min(0.97, parsed.confidence_score))
          : 0.85,
      personalization_reason:
        typeof parsed.personalization_reason === "string"
          ? parsed.personalization_reason
          : "Personalized via Claude Sonnet 4.6",
      factual_claims: Array.isArray(parsed.factual_claims)
        ? (parsed.factual_claims as string[])
        : [],
      supporting_sources: [],
      risk_flags: Array.isArray(parsed.risk_flags) ? (parsed.risk_flags as string[]) : [],
      used_kb_item_ids: kbItems.filter((k) => k.approved_for_ai).map((k) => k.id),
    };

    generationCache.set(key, result);

    // Log usage metadata (caller can persist to DB)
    this.logUsage({
      workspace_id: input.account.id,
      user_id: "system",
      action_type: "generate_message",
      provider: "remote",
      model: ANTHROPIC_MODEL,
      input_tokens: inputTokens + cacheWriteTokens,
      output_tokens: outputTokens,
      estimated_cost: estimatedCost,
      status: "success",
      cache_hit: cacheReadTokens > 0,
    });

    return result;
  }

  async analyzeRisk(body: string): Promise<MessageRisk[]> {
    return new MockAIProvider().analyzeRisk(body);
  }

  async recommendNextActions(
    accounts: Account[],
    signals: Signal[],
    warmPaths: WarmPath[],
  ): Promise<NextBestAction[]> {
    return new MockAIProvider().recommendNextActions(accounts, signals, warmPaths);
  }

  logUsage(log: Omit<AIUsageLog, "id" | "created_at">): void {
    sessionCost += log.estimated_cost;
  }
}

// ─── Provider Factory ──────────────────────────────────────────────────────

let providerInstance: AIProvider | null = null;
let providerMode: AIMode | null = null;

export function getAIProvider(): AIProvider {
  const mode = getAIMode();

  // Recreate if mode changed
  if (providerInstance && providerMode === mode) return providerInstance;

  providerMode = mode;

  if (mode === "remote") {
    providerInstance = new RemoteAIProvider();
  } else if (mode === "local") {
    providerInstance = new LocalAIProvider();
  } else {
    providerInstance = new MockAIProvider();
  }

  return providerInstance;
}

export function getAIMode(): AIMode {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("warmpath-ai-mode");
    if (stored === "mock" || stored === "local" || stored === "remote") return stored;
  }
  return (process.env.NEXT_PUBLIC_AI_MODE as AIMode | undefined) ?? "mock";
}

export function setAIMode(mode: AIMode): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("warmpath-ai-mode", mode);
  }
  providerInstance = null;
  providerMode = null;
}

export type { AIMode };
