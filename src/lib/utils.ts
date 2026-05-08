import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function scoreColor(score: number): string {
  if (score >= 85) return "text-emerald-500";
  if (score >= 70) return "text-amber-500";
  return "text-red-500";
}

export function scoreBgColor(score: number): string {
  if (score >= 85) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (score >= 70) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  return "bg-red-500/10 text-red-500 border-red-500/20";
}

export function urgencyColor(urgency: "high" | "medium" | "low"): string {
  if (urgency === "high") return "bg-red-500/10 text-red-500 border-red-500/20";
  if (urgency === "medium") return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  return "bg-muted text-muted-foreground";
}

export function signalTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    job_posting: "Hiring Signal",
    funding: "Funding Round",
    website_visit: "Website Visit",
    pricing_page_visit: "Pricing Page",
    competitor_hiring: "Competitor Signal",
    tech_stack_change: "Tech Change",
    leadership_change: "Leadership Change",
    linkedin_post: "LinkedIn Post",
    product_launch: "Product Launch",
    g2_review: "G2 Intent",
    champion_job_change: "Champion Moved",
    crm_stage_change: "Stage Change",
    intent_topic_surge: "Intent Surge",
    relationship_decay: "Relationship Cooling",
  };
  return labels[type] ?? type;
}

export function signalTypeColor(type: string): string {
  const colors: Record<string, string> = {
    job_posting: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    funding: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    website_visit: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    pricing_page_visit: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    competitor_hiring: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    tech_stack_change: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    leadership_change: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    linkedin_post: "bg-sky-500/10 text-sky-500 border-sky-500/20",
    product_launch: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    g2_review: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    champion_job_change: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    crm_stage_change: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    intent_topic_surge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    relationship_decay: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  };
  return colors[type] ?? "bg-muted text-muted-foreground";
}

export function planLabel(plan: string): string {
  const labels: Record<string, string> = {
    free: "Free",
    growth: "Growth",
    scale: "Scale",
    enterprise: "Enterprise",
  };
  return labels[plan] ?? plan;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
