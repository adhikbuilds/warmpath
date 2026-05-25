const BASE_URL = "https://api.happenstance.ai";
const API_KEY = process.env.HAPPENSTANCE_API_KEY ?? "";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Polling helper ────────────────────────────────────────────────────────────

async function pollUntilComplete<T>(
  id: string,
  endpoint: string,
  maxAttempts = 20,
  intervalMs = 2000,
): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${BASE_URL}${endpoint}/${id}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!res.ok) throw new Error(`Happenstance poll error: ${res.status}`);
    const data = await res.json();
    if (data.status === "complete" || data.status === "completed") return data as T;
    if (data.status === "failed") throw new Error("Happenstance job failed");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Happenstance polling timeout");
}

// ── Mock data (used when no API key) ──────────────────────────────────────────

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
    body: JSON.stringify({ query: description, limit: options?.limit ?? 10 }),
  });
  if (!res.ok) throw new Error(`Happenstance search error: ${res.status}`);
  const { id } = await res.json();
  const result = await pollUntilComplete<{ results: HappenstanceResult[] }>(id, "/v1/search");
  return result.results ?? [];
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

  const res = await fetch(`${BASE_URL}/v1/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      name: person.name,
      company: person.company,
      linkedin_url: person.linkedinUrl,
    }),
  });
  if (!res.ok) throw new Error(`Happenstance research error: ${res.status}`);
  const { id } = await res.json();
  return pollUntilComplete<HappenstanceProfile>(id, "/v1/research");
}
