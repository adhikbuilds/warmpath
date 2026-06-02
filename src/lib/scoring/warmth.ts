/**
 * WarmPath Warmth Score Engine
 *
 * 4-factor scoring model (100-point scale):
 *   Factor 1 — Relationship Path Strength (40 pts)
 *   Factor 2 — Recency of Touch            (25 pts)
 *   Factor 3 — ICP Fit                     (20 pts)
 *   Factor 4 — Active Buying Signal        (15 pts)
 *
 * Returns a score (0–100) and a human-readable breakdown string
 * suitable for showing in tooltips or audit logs.
 */

export type WarmthInput = {
  contact: {
    id: string;
    seniority?: string | null;
    department?: string | null;
    persona?: string | null;
  };
  targetIndustry?: string | null;
  contactIndustry?: string | null;
  targetSize?: string | null;
  contactSize?: string | null;

  // Path data
  bestPathDegree?: 1 | 2 | 3 | null;
  connectorInteractionCount?: number; // interactions connector had with prospect in last 90d
  lastInteractionDaysAgo?: number | null;

  // ICP
  icpIndustryMatch?: "exact" | "adjacent" | "none";
  icpSizeMatch?: "exact" | "adjacent" | "none";
  icpPersonaMatch?: boolean;

  // Signal
  signalUrgencyScore?: number | null;
};

export type WarmthResult = {
  score: number;
  pathStrength: number;
  recencyScore: number;
  icpFitScore: number;
  signalBoost: number;
  breakdown: string;
};

const ICP_INDUSTRY_ADJACENT: Record<string, string[]> = {
  SaaS: ["Cloud", "DevTools", "Fintech", "HR Tech"],
  Fintech: ["SaaS", "Banking", "Insurance", "Payments"],
  Healthcare: ["Health Tech", "Biotech", "Pharma"],
  "E-commerce": ["Retail", "Logistics", "Marketplace"],
  Enterprise: ["SaaS", "Cloud", "Security"],
};

function industryMatchLevel(a?: string | null, b?: string | null): "exact" | "adjacent" | "none" {
  if (!a || !b) return "none";
  if (a.toLowerCase() === b.toLowerCase()) return "exact";
  const adjacent = ICP_INDUSTRY_ADJACENT[a] ?? [];
  if (adjacent.some((x) => x.toLowerCase() === b.toLowerCase())) return "adjacent";
  return "none";
}

export function computeWarmthScore(input: WarmthInput): WarmthResult {
  // ── Factor 1: Relationship Path Strength (0–40) ──────────────────────────
  let pathStrength = 0;
  const degree = input.bestPathDegree;
  if (degree === 1) {
    pathStrength = 40;
  } else if (degree === 2) {
    const interactions = input.connectorInteractionCount ?? 0;
    pathStrength = interactions >= 3 ? 35 : interactions >= 1 ? 25 : 20;
  } else if (degree === 3) {
    pathStrength = 10;
  }

  // ── Factor 2: Recency of Touch (0–25) ────────────────────────────────────
  let recencyScore = 0;
  const days = input.lastInteractionDaysAgo;
  if (days !== null && days !== undefined) {
    if (days < 30) recencyScore = 25;
    else if (days < 90) recencyScore = 18;
    else if (days < 180) recencyScore = 10;
    else if (days < 365) recencyScore = 5;
    else recencyScore = 0;
  }

  // ── Factor 3: ICP Fit (0–20) ──────────────────────────────────────────────
  let icpFitScore = 0;

  // Industry match (0–8)
  const industryMatch =
    input.icpIndustryMatch ?? industryMatchLevel(input.targetIndustry, input.contactIndustry);
  icpFitScore += industryMatch === "exact" ? 8 : industryMatch === "adjacent" ? 4 : 0;

  // Company size match (0–6)
  const sizeMatch = input.icpSizeMatch ?? "none";
  icpFitScore += sizeMatch === "exact" ? 6 : sizeMatch === "adjacent" ? 3 : 0;

  // Persona/title match (0–6)
  if (input.icpPersonaMatch) icpFitScore += 6;
  else {
    // Heuristic: senior = +3, VP/Director/C-suite = +5
    const seniority = (input.contact.seniority ?? "").toLowerCase();
    if (/c.?suite|chief|president/.test(seniority)) icpFitScore += 5;
    else if (/vp|vice president|director/.test(seniority)) icpFitScore += 4;
    else if (/senior|lead|head/.test(seniority)) icpFitScore += 3;
    else if (/manager|specialist/.test(seniority)) icpFitScore += 2;
  }

  icpFitScore = Math.min(20, icpFitScore);

  // ── Factor 4: Buying Signal (0–15) ───────────────────────────────────────
  let signalBoost = 0;
  const urgency = input.signalUrgencyScore ?? 0;
  if (urgency >= 80) signalBoost = 15;
  else if (urgency >= 50) signalBoost = 8;
  else if (urgency > 0) signalBoost = 3;

  // ── Total ─────────────────────────────────────────────────────────────────
  const score = Math.min(100, Math.round(pathStrength + recencyScore + icpFitScore + signalBoost));

  // ── Breakdown string ──────────────────────────────────────────────────────
  const parts: string[] = [];
  if (pathStrength > 0) {
    const label =
      degree === 1 ? "direct connection" : degree === 2 ? "2nd-degree path" : "3rd-degree path";
    parts.push(`${pathStrength}pt ${label}`);
  }
  if (recencyScore > 0) {
    const label =
      days !== null && days !== undefined
        ? days < 30
          ? "touched <30d ago"
          : days < 90
            ? "touched <90d"
            : "touched <180d"
        : "recent interaction";
    parts.push(`${recencyScore}pt ${label}`);
  }
  if (icpFitScore > 0) {
    parts.push(`${icpFitScore}pt ICP fit`);
  }
  if (signalBoost > 0) {
    parts.push(`${signalBoost}pt active signal`);
  }

  const breakdown =
    parts.length > 0 ? `${score} — ${parts.join(" · ")}` : `${score} — no path or signal data`;

  return { score, pathStrength, recencyScore, icpFitScore, signalBoost, breakdown };
}

/**
 * Lightweight version that works with the demo data shape used in Zustand stores.
 * Infers factors from available fields (warmth_score on warm path, recency from edge data).
 */
export function computeWarmthFromDemoData(opts: {
  contact: { warmth_score?: number; persona?: string; seniority?: string };
  warmPath?: { warmth_score?: number; path_nodes?: Array<{ type: string }> } | null;
  signal?: { urgency_score?: number } | null;
}): WarmthResult {
  const { contact, warmPath, signal } = opts;

  // Infer path degree from path_nodes length
  const nodeCount = warmPath?.path_nodes?.length ?? 0;
  const degree: 1 | 2 | 3 | null =
    nodeCount <= 1 ? 1 : nodeCount === 2 ? 2 : nodeCount === 3 ? 2 : 3;

  return computeWarmthScore({
    contact: {
      id: "",
      seniority: contact.seniority,
      persona: contact.persona,
    },
    bestPathDegree: warmPath ? degree : null,
    connectorInteractionCount: warmPath ? 2 : 0,
    lastInteractionDaysAgo: warmPath ? 45 : null,
    icpIndustryMatch: "adjacent",
    icpSizeMatch: "exact",
    icpPersonaMatch: false,
    signalUrgencyScore: signal?.urgency_score ?? 0,
  });
}
