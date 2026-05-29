const BASE_URL = "https://api.happenstance.ai";
const API_KEY = process.env.HAPPENSTANCE_API_KEY ?? "";

// ── Public types (consumed by routes + UI — keep stable) ───────────────────────

export interface HappenstanceResult {
  id: string;
  name: string;
  title?: string;
  company?: string;
  summary?: string;
  linkedin_url?: string;
  happenstance_url?: string;
  warm_path?: string; // who in your network knows them
}

export interface HappenstanceProfile {
  id: string;
  name: string;
  current_title?: string;
  current_company?: string;
  employment_history?: Array<{ company: string; title: string; start?: string; end?: string }>;
  recent_posts?: Array<{ text: string; date: string; platform: string }>;
  hooks?: string[]; // personalization hooks extracted from their activity
  linkedin_url?: string;
  bio?: string;
}

// ── Wire types (match the verified Happenstance OpenAPI v1 spec) ────────────────
// Source: https://developer.happenstance.ai/openapi.json

interface SocialsV1 {
  happenstance_url?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
}

interface SearchMutualV1 {
  index: number;
  id: string;
  name: string;
  happenstance_url: string;
}

interface SearchPersonV1 {
  id: string;
  name: string;
  weighted_traits_score: number;
  current_title?: string | null;
  current_company?: string | null;
  summary?: string | null;
  socials: SocialsV1;
  mutuals?: SearchMutualV1[] | null;
}

interface GetSearchResponseV1 {
  id: string;
  url: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  results?: SearchPersonV1[] | null;
  has_more?: boolean;
}

interface EmploymentV1 {
  company_name?: string | null;
  job_title?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
}

interface WritingV1 {
  title?: string | null;
  description?: string | null;
  date?: string | null;
}

interface ProfileV1 {
  person_metadata?: { full_name?: string | null; tagline?: string | null } | null;
  employment?: EmploymentV1[] | null;
  writings?: WritingV1[] | null;
  summary?: { text?: string | null } | null;
}

interface GetResearchResponseV1 {
  id: string;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "FAILED_AMBIGUOUS";
  query: string;
  profile?: ProfileV1 | null;
}

// ── Polling helper ──────────────────────────────────────────────────────────────
// Happenstance is async: POST returns { id }, then GET /{endpoint}/{id} until
// status === "COMPLETED". Status values are UPPERCASE per the spec.

async function pollUntilComplete<T extends { status: string }>(
  id: string,
  endpoint: string,
  maxAttempts = 30,
  intervalMs = 2000,
): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${BASE_URL}${endpoint}/${id}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!res.ok) throw new Error(`Happenstance poll error: ${res.status}`);
    const data = (await res.json()) as T;
    if (data.status === "COMPLETED") return data;
    if (data.status.startsWith("FAILED")) {
      throw new Error(`Happenstance job ${data.status}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Happenstance polling timeout");
}

// ── Mappers (wire shape → public shape) ──────────────────────────────────────────

function mapPerson(p: SearchPersonV1): HappenstanceResult {
  const warmPath = p.mutuals?.length
    ? `${p.mutuals.map((m) => m.name).join(" → ")} → ${p.name}`
    : undefined;
  return {
    id: p.id,
    name: p.name,
    title: p.current_title ?? undefined,
    company: p.current_company ?? undefined,
    summary: p.summary ?? undefined,
    linkedin_url: p.socials?.linkedin_url ?? undefined,
    happenstance_url: p.socials?.happenstance_url ?? undefined,
    warm_path: warmPath,
  };
}

function mapProfile(id: string, query: string, profile: ProfileV1): HappenstanceProfile {
  const employment = profile.employment ?? [];
  const writings = profile.writings ?? [];
  const summaryText = profile.summary?.text ?? undefined;

  // Derive personalization hooks from the summary tagline + recent writings.
  const hooks: string[] = [];
  if (profile.person_metadata?.tagline) hooks.push(profile.person_metadata.tagline);
  for (const w of writings.slice(0, 3)) {
    if (w.title) hooks.push(w.title);
  }

  return {
    id,
    name: profile.person_metadata?.full_name ?? query,
    current_title: employment[0]?.job_title ?? undefined,
    current_company: employment[0]?.company_name ?? undefined,
    employment_history: employment.map((e) => ({
      company: e.company_name ?? "",
      title: e.job_title ?? "",
      start: e.start_date ?? undefined,
      end: e.end_date ?? undefined,
    })),
    recent_posts: writings.map((w) => ({
      text: w.title ?? w.description ?? "",
      date: w.date ?? "",
      platform: "writing",
    })),
    hooks,
    bio: summaryText,
  };
}

// ── Mock data (used when no API key — keeps demo + dev working offline) ──────────

const MOCK_SEARCH_RESULTS: HappenstanceResult[] = [
  {
    id: "h-1",
    name: "Priya Sharma",
    title: "VP Sales",
    company: "Acme AI",
    summary: "Sales leader at AI-native GTM companies. Former Outreach, Gong.",
    linkedin_url: "https://linkedin.com/in/priyasharma",
    warm_path: "Sarah Chen → Priya Sharma (worked together at Outreach)",
  },
  {
    id: "h-2",
    name: "Marcus Chen",
    title: "Head of Revenue",
    company: "Finpilot",
    summary: "Revenue leader scaling B2B SaaS from 1M to 10M ARR. Open to conversations.",
    linkedin_url: "https://linkedin.com/in/marcuschen",
    warm_path: "Rohan Mehta → Marcus Chen (Stanford MBA cohort)",
  },
  {
    id: "h-3",
    name: "Elena Rodriguez",
    title: "Director of Sales",
    company: "Stripe",
    summary: "Sales at Stripe, ex-Brex. Passionate about warm outbound and relationship selling.",
    linkedin_url: "https://linkedin.com/in/elenarodriguez",
    warm_path: "Adhik Agarwal → Elena Rodriguez (YC community)",
  },
  {
    id: "h-4",
    name: "Rajesh Patel",
    title: "CRO",
    company: "Gong.io",
    summary: "Chief Revenue Officer. Building the next generation of revenue intelligence.",
    linkedin_url: "https://linkedin.com/in/rajeshpatel",
    warm_path: "Sarah Chen → Mike Lee → Rajesh Patel (2nd degree)",
  },
  {
    id: "h-5",
    name: "Divya Kapoor",
    title: "Head of Revenue",
    company: "Notion Labs",
    summary: "New role at Notion. Building outbound motion from scratch. Loves warm intros.",
    linkedin_url: "https://linkedin.com/in/divyakapoor",
    warm_path: "Rohan Mehta → Divya Kapoor (ex-colleagues at Razorpay)",
  },
];

const MOCK_RESEARCH_PROFILE: HappenstanceProfile = {
  id: "research-1",
  name: "Priya Sharma",
  current_title: "VP Sales",
  current_company: "Acme AI",
  employment_history: [
    { company: "Acme AI", title: "VP Sales", start: "2024-03" },
    { company: "Outreach", title: "Senior AE", start: "2021-06", end: "2024-02" },
    { company: "Gong.io", title: "Account Executive", start: "2019-01", end: "2021-05" },
  ],
  recent_posts: [
    {
      text: "Tired of AI tools that blast generic emails. We need warm, relationship-led outreach.",
      date: "2 days ago",
      platform: "LinkedIn",
    },
    {
      text: "Just hit quota using only warm intros this quarter. The data doesn't lie — 34% reply rates.",
      date: "1 week ago",
      platform: "LinkedIn",
    },
  ],
  hooks: [
    "VP Sales at Acme AI — actively scaling their outbound motion with reduced headcount",
    "Posted about frustration with generic AI outreach tools 2 days ago — directly your ICP pain point",
    "Hit quota using only warm intros — she already believes in the warm outreach thesis",
    "Mutual connection Sarah Chen worked with her at Outreach — strong intro path",
  ],
  linkedin_url: "https://linkedin.com/in/priyasharma",
  bio: "Sales leader with 7 years scaling outbound at top SaaS companies. Passionate about relationship-first selling.",
};

// ── Exported functions ────────────────────────────────────────────────────────

export async function searchNetwork(
  description: string,
  options?: { limit?: number },
): Promise<HappenstanceResult[]> {
  if (!API_KEY) {
    // No key — return filtered mock results
    const lower = description.toLowerCase();
    const filtered = MOCK_SEARCH_RESULTS.filter(
      (r) =>
        !lower ||
        r.title?.toLowerCase().includes(lower) ||
        r.company?.toLowerCase().includes(lower) ||
        r.summary?.toLowerCase().includes(lower),
    );
    return (filtered.length ? filtered : MOCK_SEARCH_RESULTS).slice(0, options?.limit ?? 10);
  }

  const res = await fetch(`${BASE_URL}/v1/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      text: description,
      include_my_connections: true,
      include_friends_connections: true,
    }),
  });
  if (!res.ok) throw new Error(`Happenstance search error: ${res.status}`);
  const { id } = (await res.json()) as { id: string };
  const result = await pollUntilComplete<GetSearchResponseV1>(id, "/v1/search");
  const people = result.results ?? [];
  return people.slice(0, options?.limit ?? 10).map(mapPerson);
}

export async function researchPerson(person: {
  name: string;
  company?: string;
  linkedinUrl?: string;
}): Promise<HappenstanceProfile> {
  if (!API_KEY) {
    return {
      ...MOCK_RESEARCH_PROFILE,
      name: person.name,
      current_company: person.company ?? MOCK_RESEARCH_PROFILE.current_company,
    };
  }

  // Research takes a free-text description, not structured fields.
  const description = [
    person.name,
    person.company ? `at ${person.company}` : "",
    person.linkedinUrl ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const res = await fetch(`${BASE_URL}/v1/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) throw new Error(`Happenstance research error: ${res.status}`);
  const { id } = (await res.json()) as { id: string };
  const result = await pollUntilComplete<GetResearchResponseV1>(id, "/v1/research");
  if (!result.profile) {
    throw new Error(`Happenstance research returned no profile (status ${result.status})`);
  }
  return mapProfile(result.id, result.query, result.profile);
}
