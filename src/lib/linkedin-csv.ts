/**
 * Client-side LinkedIn connections CSV parser.
 * LinkedIn exports a CSV with a 3-line header note before the actual data.
 * Parsed contacts are bucketed into ICP segments and mapped to WarmPath types.
 */

import type { Account, Contact } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IcpSegment =
  | "founder_ceo"
  | "sales_leader"
  | "marketing_leader"
  | "product_leader"
  | "eng_leader"
  | "investor_vc"
  | "gtm_growth"
  | "other";

export interface LinkedInRow {
  firstName: string;
  lastName: string;
  url: string;
  email: string;
  company: string;
  position: string;
  connectedOn: string;
  icp: IcpSegment;
}

export interface ImportResult {
  rows: LinkedInRow[];
  byIcp: Record<IcpSegment, LinkedInRow[]>;
  accounts: Omit<Account, "id" | "created_at">[];
  contacts: Omit<Contact, "id">[];
  total: number;
}

// ─── ICP classification ───────────────────────────────────────────────────────

const ICP_RULES: Array<{ segment: IcpSegment; keywords: string[] }> = [
  {
    segment: "investor_vc",
    keywords: [
      "venture partner",
      "general partner",
      "managing partner",
      "limited partner",
      "venture capital",
      " vc ",
      "angel investor",
      "fund manager",
      "investment partner",
      "principal at",
      "associate at",
    ],
  },
  {
    segment: "founder_ceo",
    keywords: [
      "founder",
      "co-founder",
      "ceo",
      "chief executive",
      "managing director",
      "director general",
      "president & ceo",
    ],
  },
  {
    segment: "sales_leader",
    keywords: [
      "vp of sales",
      "head of sales",
      "vp sales",
      "sales director",
      "chief revenue",
      "cro",
      "vp, sales",
      "director of sales",
      "revenue leader",
    ],
  },
  {
    segment: "marketing_leader",
    keywords: [
      "vp of marketing",
      "head of marketing",
      "vp marketing",
      "chief marketing",
      "cmo",
      "marketing director",
      "director of marketing",
    ],
  },
  {
    segment: "product_leader",
    keywords: [
      "head of product",
      "vp product",
      "chief product",
      "cpo",
      "vp of product",
      "director of product",
      "product leader",
    ],
  },
  {
    segment: "eng_leader",
    keywords: [
      "cto",
      "chief technology",
      "vp engineering",
      "head of engineering",
      "vp of engineering",
      "chief engineer",
      "director of engineering",
    ],
  },
  {
    segment: "gtm_growth",
    keywords: [
      "growth",
      "gtm",
      "go-to-market",
      "demand gen",
      "revenue ops",
      "revops",
      "business development",
      "partnerships lead",
      "head of partnerships",
    ],
  },
];

export function classifyIcp(position: string): IcpSegment {
  const lower = position.toLowerCase();
  for (const { segment, keywords } of ICP_RULES) {
    if (keywords.some((kw) => lower.includes(kw))) return segment;
  }
  return "other";
}

// ─── Seniority mapping ────────────────────────────────────────────────────────

function inferSeniority(position: string, icp: IcpSegment): Contact["seniority"] {
  if (icp === "founder_ceo" || icp === "investor_vc") return "c_suite";
  if (icp === "sales_leader" || icp === "marketing_leader" || icp === "eng_leader") return "vp";
  if (icp === "product_leader") return "vp";
  const lower = position.toLowerCase();
  if (lower.includes("director") || lower.includes("head of")) return "director";
  if (lower.includes("manager") || lower.includes("lead")) return "manager";
  return "ic";
}

function inferDepartment(icp: IcpSegment): string {
  const map: Record<IcpSegment, string> = {
    founder_ceo: "Executive",
    sales_leader: "Sales",
    marketing_leader: "Marketing",
    product_leader: "Product",
    eng_leader: "Engineering",
    investor_vc: "Investments",
    gtm_growth: "GTM",
    other: "General",
  };
  return map[icp];
}

function inferPersona(icp: IcpSegment): string {
  const map: Record<IcpSegment, string> = {
    founder_ceo: "Founder — needs warm intros to close deals & raise",
    sales_leader: "Sales leader — owns outbound quota, evaluates tools",
    marketing_leader: "Marketing — drives pipeline, evaluates GTM stack",
    product_leader: "Product — evaluates integrations & workflow tools",
    eng_leader: "Engineering — technical evaluator",
    investor_vc: "Investor — potential intro hub & buyer",
    gtm_growth: "GTM/Growth — experiments with outreach channels",
    other: "General contact",
  };
  return map[icp];
}

// ─── Parser ───────────────────────────────────────────────────────────────────

export function parseLinkedInCsv(text: string): ImportResult {
  const lines = text.split("\n");

  // Find the actual header line (LinkedIn prepends a 3-line note)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].startsWith("First Name")) {
      headerIdx = i;
      break;
    }
  }

  const dataLines = lines.slice(headerIdx);
  const rows: LinkedInRow[] = [];

  // Simple CSV parser that handles quoted fields
  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  const header = parseLine(dataLines[0]);
  const idx = {
    firstName: header.findIndex((h) => h === "First Name"),
    lastName: header.findIndex((h) => h === "Last Name"),
    url: header.findIndex((h) => h === "URL"),
    email: header.findIndex((h) => h === "Email Address"),
    company: header.findIndex((h) => h === "Company"),
    position: header.findIndex((h) => h === "Position"),
    connectedOn: header.findIndex((h) => h === "Connected On"),
  };

  for (let i = 1; i < dataLines.length; i++) {
    const line = dataLines[i];
    if (!line.trim()) continue;
    const cols = parseLine(line);
    const firstName = cols[idx.firstName]?.trim() ?? "";
    const lastName = cols[idx.lastName]?.trim() ?? "";
    const company = cols[idx.company]?.trim() ?? "";
    const position = cols[idx.position]?.trim() ?? "";
    if (!firstName && !company) continue;

    const icp = classifyIcp(position);
    rows.push({
      firstName,
      lastName,
      url: cols[idx.url]?.trim() ?? "",
      email: cols[idx.email]?.trim() ?? "",
      company,
      position,
      connectedOn: cols[idx.connectedOn]?.trim() ?? "",
      icp,
    });
  }

  // Group by ICP
  const byIcp = {} as Record<IcpSegment, LinkedInRow[]>;
  const segments: IcpSegment[] = [
    "founder_ceo",
    "sales_leader",
    "marketing_leader",
    "product_leader",
    "eng_leader",
    "investor_vc",
    "gtm_growth",
    "other",
  ];
  for (const seg of segments) byIcp[seg] = [];
  for (const row of rows) byIcp[row.icp].push(row);

  // Build accounts (unique companies) — skip blanks
  const companyMap = new Map<string, Omit<Account, "id" | "created_at">>();
  for (const row of rows) {
    if (!row.company || companyMap.has(row.company)) continue;
    companyMap.set(row.company, {
      name: row.company,
      domain: `${row.company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      industry: "",
      employee_count: 50,
      location: "India",
      description: `${row.company} — imported from LinkedIn network`,
      stage: "prospect",
      fit_score: Math.floor(Math.random() * 30) + 60,
      intent_score: Math.floor(Math.random() * 40) + 40,
      warmth_score: Math.floor(Math.random() * 30) + 65,
      opportunity_score: Math.floor(Math.random() * 25) + 55,
    });
  }
  const accounts = Array.from(companyMap.values());

  // Build contacts mapped to their accounts (use company name as account_id placeholder)
  const contacts: Omit<Contact, "id">[] = rows
    .filter((r) => r.firstName && r.company)
    .map((r) => {
      const seniority = inferSeniority(r.position, r.icp);
      return {
        account_id: `li-acc-${r.company.toLowerCase().replace(/\s+/g, "-")}`,
        name: `${r.firstName} ${r.lastName}`.trim(),
        email:
          r.email ||
          `${r.firstName.toLowerCase()}.${r.lastName.toLowerCase()}@${r.company.toLowerCase().replace(/\s+/g, "")}.com`,
        title: r.position,
        linkedin_url: r.url,
        seniority,
        department: inferDepartment(r.icp),
        persona: inferPersona(r.icp),
        fit_score: seniority === "c_suite" ? 90 : seniority === "vp" ? 80 : 65,
        warmth_score: 85,
        engagement_score: 70,
      };
    });

  return { rows, byIcp, accounts, contacts, total: rows.length };
}

// ─── ICP display metadata ────────────────────────────────────────────────────

export const ICP_META: Record<IcpSegment, { label: string; color: string; emailHook: string }> = {
  founder_ceo: {
    label: "Founders & CEOs",
    color: "#2563eb",
    emailHook: "cold email isn't cutting it anymore — warm intros close 3× faster",
  },
  sales_leader: {
    label: "Sales Leaders",
    color: "#10b981",
    emailHook: "your AEs are burning quota on cold lists — WarmPath finds the warm path",
  },
  marketing_leader: {
    label: "Marketing Leaders",
    color: "#ec4899",
    emailHook: "ABM without relationship data is guesswork — WarmPath maps the signal",
  },
  product_leader: {
    label: "Product Leaders",
    color: "#f59e0b",
    emailHook: "the best product feedback comes from warm intros, not cold surveys",
  },
  eng_leader: {
    label: "Engineering Leaders",
    color: "#06b6d4",
    emailHook: "your team's best hires came through network referrals — WarmPath scales that",
  },
  investor_vc: {
    label: "Investors & VCs",
    color: "#a78bfa",
    emailHook: "warm intros to portfolio companies outperform cold deal flow 5×",
  },
  gtm_growth: {
    label: "GTM & Growth",
    color: "#4edea3",
    emailHook: "outbound that feels inbound — WarmPath routes every touch through a relationship",
  },
  other: {
    label: "General Network",
    color: "#9ca3af",
    emailHook: "stay top-of-mind with your network without sending cold emails",
  },
};
