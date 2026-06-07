import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const MOCK_LEAD_TEMPLATES = [
  {
    industry: "AI / SaaS",
    technologies: ["Salesforce", "HubSpot", "Slack", "Notion"],
    fitBase: 88,
  },
  { industry: "FinTech", technologies: ["Stripe", "Plaid", "AWS", "Snowflake"], fitBase: 82 },
  { industry: "DevTools", technologies: ["GitHub", "Linear", "Datadog", "Vercel"], fitBase: 79 },
  {
    industry: "MarTech",
    technologies: ["Segment", "Amplitude", "Intercom", "Mixpanel"],
    fitBase: 75,
  },
  {
    industry: "HRTech",
    technologies: ["Workday", "Rippling", "Greenhouse", "Lattice"],
    fitBase: 71,
  },
];

const COMPANY_NAMES = [
  "Nexus AI",
  "Velocity Labs",
  "Proxima Data",
  "Orbit Revenue",
  "Stackwise",
  "Elevate GTM",
  "Pathfinder Software",
  "Meridian Analytics",
  "Apex Growth",
  "Clarix AI",
  "Synapse HQ",
  "Conduit Platform",
  "Pinnacle Ops",
  "Zenith Revenue",
  "Catalyst Tech",
  "Horizon AI",
  "Fusion Growth",
  "Stellar RevOps",
  "Nova Platforms",
  "Vantage GTM",
];

const CITIES = [
  { city: "San Francisco", country: "US" },
  { city: "New York", country: "US" },
  { city: "Austin", country: "US" },
  { city: "Boston", country: "US" },
  { city: "Chicago", country: "US" },
  { city: "Seattle", country: "US" },
];

const DESCRIPTIONS = [
  "AI-powered revenue operations platform built for high-growth B2B teams.",
  "Modern GTM intelligence software that surfaces warm paths to decision-makers.",
  "Sales automation platform combining relationship data with buyer signals.",
  "B2B prospecting tool that turns intent data into booked meetings.",
  "Outbound sequencing platform with built-in multi-channel personalization.",
  "Revenue analytics tool helping teams understand pipeline velocity.",
  "Account-based marketing platform driving pipeline through warm outreach.",
  "Conversation intelligence software that coaches reps after every call.",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const query: string = body.query ?? "B2B SaaS";
  const requestedLimit: number = Math.min(body.limit ?? 10, 20);

  const seed = query.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = seededRandom(seed);

  const leads = Array.from({ length: requestedLimit }, (_, i) => {
    const nameIdx = Math.floor(rand() * COMPANY_NAMES.length);
    const name = COMPANY_NAMES[(nameIdx + i) % COMPANY_NAMES.length];
    const template = MOCK_LEAD_TEMPLATES[Math.floor(rand() * MOCK_LEAD_TEMPLATES.length)];
    const cityData = CITIES[Math.floor(rand() * CITIES.length)];
    const descIdx = Math.floor(rand() * DESCRIPTIONS.length);

    const techCount = 2 + Math.floor(rand() * 3);
    const shuffledTechs = [...template.technologies].sort(() => rand() - 0.5);
    const technologies = shuffledTechs.slice(0, techCount);

    const domain = `${name
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "")}.io`;
    const employees = [25, 50, 80, 120, 200, 350, 500][Math.floor(rand() * 7)];
    const fitScore = template.fitBase - Math.floor(rand() * 18);

    return {
      name,
      domain,
      website: `https://${domain}`,
      industry: template.industry,
      description: DESCRIPTIONS[(descIdx + i) % DESCRIPTIONS.length],
      city: cityData.city,
      country: cityData.country,
      employee_count_estimate: employees,
      technologies,
      emails_found: [`hello@${domain}`, `sales@${domain}`],
      fit_score_estimate: fitScore,
      source: "ai_generated",
    };
  });

  return NextResponse.json({ leads, mode: "ai_generated" });
}
