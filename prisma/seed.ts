/**
 * Seed script populates the database with demo data for the WarmPath prototype.
 * Run with: bun run db:seed
 */

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const url = (process.env.DATABASE_URL ?? "file:./prisma/dev.db").replace(/^file:/, "");
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ── 1. Demo User ──────────────────────────────────────────────────────────
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@warmpath.ai" },
    update: {},
    create: {
      id: "user-1",
      email: "demo@warmpath.ai",
      name: "Adhik Agarwal",
      role: "owner",
      password: await bcrypt.hash("demo123", 10),
    },
  });

  // Additional team member users
  const teamUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: "sarah@warmpath.ai" },
      update: {},
      create: { id: "tm-2", email: "sarah@warmpath.ai", name: "Sarah Chen", role: "admin" },
    }),
    prisma.user.upsert({
      where: { email: "rohan@warmpath.ai" },
      update: {},
      create: { id: "tm-3", email: "rohan@warmpath.ai", name: "Rohan Mehta", role: "sales_rep" },
    }),
    prisma.user.upsert({
      where: { email: "maya@warmpath.ai" },
      update: {},
      create: { id: "tm-4", email: "maya@warmpath.ai", name: "Maya Iyer", role: "sales_rep" },
    }),
  ]);

  console.log(`  ✓ Users: ${1 + teamUsers.length}`);

  // ── 2. Workspace ──────────────────────────────────────────────────────────
  const workspace = await prisma.workspace.upsert({
    where: { id: "ws-1" },
    update: {},
    create: {
      id: "ws-1",
      name: "WarmPath",
      domain: "warmpath.ai",
      industry: "AI / Sales Tech",
      companySize: "1–10",
      website: "https://warmpath.ai",
      description:
        "AI-powered warm outbound sales agent that routes outreach through your team's relationship graph.",
      plan: "growth",
      onboardingStage: "complete",
      healthScore: 87,
      ownerId: demoUser.id,
    },
  });

  // ── 3. Workspace Members ──────────────────────────────────────────────────
  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: demoUser.id } },
    update: {},
    create: {
      id: "wm-1",
      workspaceId: workspace.id,
      userId: demoUser.id,
      role: "owner",
      title: "Founder & CEO",
      connectedSources: JSON.stringify(["gmail", "linkedin", "google_calendar"]),
      relationshipScore: 95,
    },
  });

  const memberDefs = [
    {
      id: "wm-2",
      userId: "tm-2",
      role: "admin",
      title: "Advisor Ex-Salesforce",
      sources: ["gmail", "linkedin", "salesforce"],
      score: 88,
    },
    {
      id: "wm-3",
      userId: "tm-3",
      role: "sales_rep",
      title: "Co-Founder",
      sources: ["gmail", "linkedin"],
      score: 82,
    },
    {
      id: "wm-4",
      userId: "tm-4",
      role: "sales_rep",
      title: "Sales Consultant",
      sources: ["outlook", "linkedin", "hubspot"],
      score: 76,
    },
  ];

  for (const m of memberDefs) {
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: m.userId } },
      update: {},
      create: {
        id: m.id,
        workspaceId: workspace.id,
        userId: m.userId,
        role: m.role,
        title: m.title,
        connectedSources: JSON.stringify(m.sources),
        relationshipScore: m.score,
      },
    });
  }

  console.log("  ✓ Workspace + members");

  // ── 4. Business Accounts ──────────────────────────────────────────────────
  const accountDefs = [
    {
      id: "acc-1",
      name: "Acme AI",
      domain: "acme.ai",
      industry: "AI / SaaS",
      employeeCount: 120,
      location: "San Francisco, CA",
      description: "AI-powered revenue operations platform for mid-market B2B companies.",
      stage: "engaged",
      fitScore: 94,
      intentScore: 91,
      warmthScore: 88,
      opportunityScore: 92,
    },
    {
      id: "acc-2",
      name: "Finpilot",
      domain: "finpilot.com",
      industry: "FinTech",
      employeeCount: 85,
      location: "New York, NY",
      description: "AI copilot for financial analysts automating research and reporting.",
      stage: "meeting",
      fitScore: 91,
      intentScore: 88,
      warmthScore: 72,
      opportunityScore: 86,
    },
    {
      id: "acc-3",
      name: "RevScale",
      domain: "revscale.io",
      industry: "Sales Tech",
      employeeCount: 210,
      location: "Austin, TX",
      description: "Revenue acceleration platform for Series A–C SaaS companies.",
      stage: "prospect",
      fitScore: 89,
      intentScore: 95,
      warmthScore: 65,
      opportunityScore: 84,
    },
    {
      id: "acc-4",
      name: "CloudNest",
      domain: "cloudnest.dev",
      industry: "DevTools",
      employeeCount: 55,
      location: "Seattle, WA",
      description: "Cloud infrastructure tooling for developer-led organizations.",
      stage: "prospect",
      fitScore: 82,
      intentScore: 79,
      warmthScore: 91,
      opportunityScore: 84,
    },
    {
      id: "acc-5",
      name: "Northstar Analytics",
      domain: "northstar.io",
      industry: "Analytics / BI",
      employeeCount: 145,
      location: "Chicago, IL",
      description: "Next-gen business intelligence for data teams at growth-stage companies.",
      stage: "prospect",
      fitScore: 87,
      intentScore: 73,
      warmthScore: 78,
      opportunityScore: 80,
    },
    {
      id: "acc-6",
      name: "LedgerFlow",
      domain: "ledgerflow.com",
      industry: "FinTech",
      employeeCount: 68,
      location: "Boston, MA",
      description: "Automated accounting workflows for finance teams at startups.",
      stage: "engaged",
      fitScore: 85,
      intentScore: 82,
      warmthScore: 69,
      opportunityScore: 79,
    },
    {
      id: "acc-7",
      name: "BrightOps",
      domain: "brightops.com",
      industry: "RevOps / GTM",
      employeeCount: 95,
      location: "Denver, CO",
      description: "RevOps automation platform integrates CRM, data, and go-to-market execution.",
      stage: "prospect",
      fitScore: 96,
      intentScore: 88,
      warmthScore: 74,
      opportunityScore: 87,
    },
    {
      id: "acc-8",
      name: "TalentGrid",
      domain: "talentgrid.ai",
      industry: "HR Tech",
      employeeCount: 175,
      location: "San Francisco, CA",
      description: "AI-driven talent intelligence and hiring automation platform.",
      stage: "prospect",
      fitScore: 78,
      intentScore: 86,
      warmthScore: 83,
      opportunityScore: 82,
    },
    {
      id: "acc-9",
      name: "VectorPay",
      domain: "vectorpay.io",
      industry: "Payments",
      employeeCount: 130,
      location: "New York, NY",
      description: "B2B payments infrastructure for SaaS companies and marketplaces.",
      stage: "prospect",
      fitScore: 80,
      intentScore: 77,
      warmthScore: 62,
      opportunityScore: 74,
    },
    {
      id: "acc-10",
      name: "OrbitCRM",
      domain: "orbitcrm.com",
      industry: "CRM / Sales",
      employeeCount: 320,
      location: "Miami, FL",
      description: "Modern CRM built for high-velocity sales teams pipeline-first, signal-aware.",
      stage: "proposal",
      fitScore: 92,
      intentScore: 84,
      warmthScore: 70,
      opportunityScore: 83,
    },
  ];

  for (const a of accountDefs) {
    await prisma.bizAccount.upsert({
      where: { id: a.id },
      update: {},
      create: { ...a, workspaceId: workspace.id },
    });
  }

  console.log(`  ✓ Accounts: ${accountDefs.length}`);

  // ── 5. Contacts ───────────────────────────────────────────────────────────
  const contactDefs = [
    {
      id: "con-1",
      accountId: "acc-1",
      name: "Priya Sharma",
      email: "priya@acme.ai",
      title: "VP of Sales",
      linkedinUrl: "https://linkedin.com/in/priyasharma",
      seniority: "vp",
      department: "Sales",
      persona: "Revenue Leader",
      fitScore: 95,
      warmthScore: 88,
      engagementScore: 76,
    },
    {
      id: "con-2",
      accountId: "acc-1",
      name: "Marcus Williams",
      email: "marcus@acme.ai",
      title: "Head of RevOps",
      seniority: "director",
      department: "RevOps",
      persona: "RevOps Builder",
      fitScore: 90,
      warmthScore: 72,
      engagementScore: 64,
    },
    {
      id: "con-3",
      accountId: "acc-2",
      name: "Elena Rodriguez",
      email: "elena@finpilot.com",
      title: "CEO",
      linkedinUrl: "https://linkedin.com/in/elenarodriguez",
      seniority: "c_suite",
      department: "Executive",
      persona: "Founder / CEO",
      fitScore: 91,
      warmthScore: 72,
      engagementScore: 81,
    },
    {
      id: "con-4",
      accountId: "acc-2",
      name: "James Park",
      email: "james@finpilot.com",
      title: "VP of Growth",
      seniority: "vp",
      department: "Growth",
      persona: "Growth Leader",
      fitScore: 88,
      warmthScore: 65,
      engagementScore: 58,
    },
    {
      id: "con-5",
      accountId: "acc-3",
      name: "David Kim",
      email: "david@revscale.io",
      title: "CRO",
      seniority: "c_suite",
      department: "Revenue",
      persona: "Revenue Leader",
      fitScore: 92,
      warmthScore: 65,
      engagementScore: 72,
    },
    {
      id: "con-6",
      accountId: "acc-3",
      name: "Samantha Torres",
      email: "sam@revscale.io",
      title: "Director of Sales",
      seniority: "director",
      department: "Sales",
      persona: "Sales Manager",
      fitScore: 88,
      warmthScore: 71,
      engagementScore: 60,
    },
    {
      id: "con-7",
      accountId: "acc-4",
      name: "Liam Chen",
      email: "liam@cloudnest.dev",
      title: "CTO",
      seniority: "c_suite",
      department: "Engineering",
      persona: "Technical Buyer",
      fitScore: 82,
      warmthScore: 91,
      engagementScore: 88,
    },
    {
      id: "con-8",
      accountId: "acc-5",
      name: "Aisha Patel",
      email: "aisha@northstar.io",
      title: "Head of Data",
      seniority: "director",
      department: "Data",
      persona: "Data Leader",
      fitScore: 87,
      warmthScore: 78,
      engagementScore: 70,
    },
    {
      id: "con-9",
      accountId: "acc-6",
      name: "Tom Nakamura",
      email: "tom@ledgerflow.com",
      title: "VP Finance",
      seniority: "vp",
      department: "Finance",
      persona: "Finance Buyer",
      fitScore: 85,
      warmthScore: 69,
      engagementScore: 55,
    },
    {
      id: "con-10",
      accountId: "acc-7",
      name: "Rachel Green",
      email: "rachel@brightops.com",
      title: "CEO",
      seniority: "c_suite",
      department: "Executive",
      persona: "Founder / CEO",
      fitScore: 96,
      warmthScore: 74,
      engagementScore: 67,
    },
    {
      id: "con-11",
      accountId: "acc-8",
      name: "Kevin Zhang",
      email: "kevin@talentgrid.ai",
      title: "VP Sales",
      seniority: "vp",
      department: "Sales",
      persona: "Revenue Leader",
      fitScore: 78,
      warmthScore: 83,
      engagementScore: 79,
    },
    {
      id: "con-12",
      accountId: "acc-10",
      name: "Nina Okoye",
      email: "nina@orbitcrm.com",
      title: "Head of Partnerships",
      seniority: "director",
      department: "Partnerships",
      persona: "Partnership Buyer",
      fitScore: 92,
      warmthScore: 70,
      engagementScore: 63,
    },
  ];

  for (const c of contactDefs) {
    await prisma.contact.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, workspaceId: workspace.id },
    });
  }

  console.log(`  ✓ Contacts: ${contactDefs.length}`);

  // ── 6. Signals ────────────────────────────────────────────────────────────
  const now = Date.now();
  const h = (hours: number) => new Date(now - hours * 3600 * 1000);

  const signalDefs = [
    {
      id: "sig-1",
      accountId: "acc-1",
      contactId: "con-1",
      type: "job_posting",
      title: "Acme AI is hiring 4 SDRs and a RevOps Manager",
      description:
        "Acme AI posted 4 SDR roles and a RevOps Manager on LinkedIn in the last 7 days.",
      source: "LinkedIn Jobs",
      urgencyScore: 92,
      confidenceScore: 95,
      detectedAt: h(2),
    },
    {
      id: "sig-2",
      accountId: "acc-2",
      type: "pricing_page_visit",
      title: "Finpilot visited the pricing page twice this week",
      description:
        "finpilot.com IP visited your pricing page on Mon and Wed. They spent 4 min on the Growth plan details.",
      source: "Website Tracking",
      urgencyScore: 88,
      confidenceScore: 85,
      detectedAt: h(18),
    },
    {
      id: "sig-3",
      accountId: "acc-3",
      type: "funding",
      title: "RevScale raised $12M Series A",
      description:
        "RevScale announced a $12M Series A led by Bessemer. They plan to 3x their GTM team.",
      source: "TechCrunch",
      sourceUrl: "https://techcrunch.com",
      urgencyScore: 95,
      confidenceScore: 99,
      detectedAt: h(36),
    },
    {
      id: "sig-4",
      accountId: "acc-4",
      contactId: "con-7",
      type: "linkedin_post",
      title: "CloudNest CTO posted about scaling their outbound motion",
      description:
        "Liam Chen posted about building outbound from 0 to 1 as their biggest challenge.",
      source: "LinkedIn",
      urgencyScore: 91,
      confidenceScore: 97,
      detectedAt: h(4),
    },
    {
      id: "sig-5",
      accountId: "acc-6",
      type: "tech_stack_change",
      title: "LedgerFlow added HubSpot to their tech stack",
      description:
        "LedgerFlow's job postings now require HubSpot experience. They recently adopted HubSpot CRM.",
      source: "BuiltWith / Job Signals",
      urgencyScore: 78,
      confidenceScore: 82,
      detectedAt: h(72),
    },
    {
      id: "sig-6",
      accountId: "acc-8",
      contactId: "con-11",
      type: "champion_job_change",
      title: "Kevin Zhang moved from Northstar to TalentGrid",
      description:
        "Kevin Zhang, formerly Head of Sales at Northstar Analytics, just joined TalentGrid as VP Sales.",
      source: "LinkedIn",
      urgencyScore: 86,
      confidenceScore: 98,
      detectedAt: h(8),
    },
    {
      id: "sig-7",
      accountId: "acc-7",
      contactId: "con-10",
      type: "job_posting",
      title: "BrightOps hiring 3 Account Executives and a Sales Engineer",
      description: "BrightOps posted 3 AE roles (Mid-Market focus) and a Sales Engineer.",
      source: "LinkedIn Jobs",
      urgencyScore: 89,
      confidenceScore: 92,
      detectedAt: h(6),
    },
    {
      id: "sig-8",
      accountId: "acc-10",
      type: "g2_review",
      title: "OrbitCRM reviewing AI sales tools on G2",
      description:
        "OrbitCRM team left reviews on 3 competing AI SDR products on G2 in the last 2 weeks.",
      source: "G2 Intent",
      urgencyScore: 83,
      confidenceScore: 88,
      detectedAt: h(24),
    },
  ];

  for (const s of signalDefs) {
    await prisma.signal.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, workspaceId: workspace.id },
    });
  }

  console.log(`  ✓ Signals: ${signalDefs.length}`);

  // ── 7. Relationship Edges ─────────────────────────────────────────────────
  const d = (days: number) => new Date(now - days * 86400 * 1000);

  const edgeDefs = [
    {
      id: "re-1",
      fromType: "team_member",
      fromId: "tm-2",
      fromName: "Sarah Chen",
      toType: "contact",
      toId: "con-1",
      toName: "Priya Sharma",
      relationshipType: "linkedin_connection",
      strengthScore: 85,
      evidence: "Connected on LinkedIn for 3 years. Interacted on 4 posts.",
      source: "LinkedIn",
      lastInteractionAt: d(14),
    },
    {
      id: "re-2",
      fromType: "team_member",
      fromId: "tm-3",
      fromName: "Rohan Mehta",
      toType: "contact",
      toId: "con-3",
      toName: "Elena Rodriguez",
      relationshipType: "email_history",
      strengthScore: 78,
      evidence: "Exchanged 6 emails at a Y Combinator event in 2024.",
      source: "Gmail",
      lastInteractionAt: d(60),
    },
    {
      id: "re-3",
      fromType: "user",
      fromId: "user-1",
      fromName: "Adhik Agarwal",
      toType: "contact",
      toId: "con-7",
      toName: "Liam Chen",
      relationshipType: "calendar_meeting",
      strengthScore: 91,
      evidence: "Met at SaaStr Annual 2025. Follow-up call in Aug 2025.",
      source: "Google Calendar",
      lastInteractionAt: d(90),
    },
    {
      id: "re-4",
      fromType: "team_member",
      fromId: "tm-4",
      fromName: "Maya Iyer",
      toType: "contact",
      toId: "con-5",
      toName: "David Kim",
      relationshipType: "linkedin_connection",
      strengthScore: 72,
      evidence: "2nd-degree connection via Andreessen Horowitz network.",
      source: "LinkedIn",
      lastInteractionAt: d(30),
    },
    {
      id: "re-5",
      fromType: "team_member",
      fromId: "tm-2",
      fromName: "Sarah Chen",
      toType: "contact",
      toId: "con-8",
      toName: "Aisha Patel",
      relationshipType: "coworker_connection",
      strengthScore: 88,
      evidence: "Worked together at Salesforce Data Cloud 2022–2024.",
      source: "LinkedIn",
      lastInteractionAt: d(7),
    },
    {
      id: "re-6",
      fromType: "user",
      fromId: "user-1",
      fromName: "Adhik Agarwal",
      toType: "contact",
      toId: "con-10",
      toName: "Rachel Green",
      relationshipType: "intro_history",
      strengthScore: 82,
      evidence: "Introduced by mutual investor. Had a discovery call in Q1 2026.",
      source: "Email",
      lastInteractionAt: d(45),
    },
    {
      id: "re-7",
      fromType: "team_member",
      fromId: "tm-3",
      fromName: "Rohan Mehta",
      toType: "contact",
      toId: "con-11",
      toName: "Kevin Zhang",
      relationshipType: "email_history",
      strengthScore: 75,
      evidence: "Kevin was at Northstar Analytics Rohan had a demo call with him in 2025.",
      source: "Gmail",
      lastInteractionAt: d(120),
    },
    {
      id: "re-8",
      fromType: "user",
      fromId: "user-1",
      fromName: "Adhik Agarwal",
      toType: "team_member",
      toId: "tm-2",
      toName: "Sarah Chen",
      relationshipType: "coworker_connection",
      strengthScore: 95,
      evidence: "Advisor relationship since 2024. Weekly syncs.",
      source: "Gmail",
      lastInteractionAt: d(2),
    },
    {
      id: "re-9",
      fromType: "user",
      fromId: "user-1",
      fromName: "Adhik Agarwal",
      toType: "team_member",
      toId: "tm-3",
      toName: "Rohan Mehta",
      relationshipType: "coworker_connection",
      strengthScore: 93,
      evidence: "Co-founder. Daily contact.",
      source: "Gmail",
      lastInteractionAt: d(1),
    },
    {
      id: "re-10",
      fromType: "user",
      fromId: "user-1",
      fromName: "Adhik Agarwal",
      toType: "team_member",
      toId: "tm-4",
      toName: "Maya Iyer",
      relationshipType: "coworker_connection",
      strengthScore: 88,
      evidence: "Sales consultant, brought in Jan 2026.",
      source: "Gmail",
      lastInteractionAt: d(3),
    },
    {
      id: "re-11",
      fromType: "user",
      fromId: "user-1",
      fromName: "Adhik Agarwal",
      toType: "contact",
      toId: "con-1",
      toName: "Priya Sharma",
      relationshipType: "linkedin_connection",
      strengthScore: 62,
      evidence: "Connected on LinkedIn after a SaaStr panel. No direct emails.",
      source: "LinkedIn",
      lastInteractionAt: d(80),
    },
    {
      id: "re-12",
      fromType: "user",
      fromId: "user-1",
      fromName: "Adhik Agarwal",
      toType: "contact",
      toId: "con-6",
      toName: "Samantha Torres",
      relationshipType: "email_history",
      strengthScore: 70,
      evidence: "Emailed 3 times about a partnership at TechCrunch Disrupt 2025.",
      source: "Gmail",
      lastInteractionAt: d(55),
    },
    {
      id: "re-13",
      fromType: "contact",
      fromId: "con-1",
      fromName: "Priya Sharma",
      toType: "contact",
      toId: "con-2",
      toName: "Marcus Williams",
      relationshipType: "coworker_connection",
      strengthScore: 82,
      evidence: "Co-workers at Acme AI.",
      source: "LinkedIn",
      lastInteractionAt: d(5),
    },
    {
      id: "re-14",
      fromType: "contact",
      fromId: "con-1",
      fromName: "Priya Sharma",
      toType: "contact",
      toId: "con-4",
      toName: "James Park",
      relationshipType: "linkedin_connection",
      strengthScore: 65,
      evidence: "Former colleagues at Salesforce, connected on LinkedIn 2023.",
      source: "LinkedIn",
      lastInteractionAt: d(40),
    },
    {
      id: "re-15",
      fromType: "contact",
      fromId: "con-5",
      fromName: "David Kim",
      toType: "contact",
      toId: "con-9",
      toName: "Tom Nakamura",
      relationshipType: "calendar_meeting",
      strengthScore: 74,
      evidence: "Met at YC Demo Day Fall 2024.",
      source: "Google Calendar",
      lastInteractionAt: d(25),
    },
    {
      id: "re-16",
      fromType: "contact",
      fromId: "con-7",
      fromName: "Liam Chen",
      toType: "contact",
      toId: "con-11",
      toName: "Kevin Zhang",
      relationshipType: "linkedin_connection",
      strengthScore: 58,
      evidence: "Alumni from the same Stanford MBA cohort.",
      source: "LinkedIn",
      lastInteractionAt: d(100),
    },
    {
      id: "re-17",
      fromType: "contact",
      fromId: "con-8",
      fromName: "Aisha Patel",
      toType: "contact",
      toId: "con-10",
      toName: "Rachel Green",
      relationshipType: "coworker_connection",
      strengthScore: 80,
      evidence: "Both at HubSpot 2021–2023. Still close professionally.",
      source: "LinkedIn",
      lastInteractionAt: d(18),
    },
    {
      id: "re-18",
      fromType: "contact",
      fromId: "con-3",
      fromName: "Elena Rodriguez",
      toType: "contact",
      toId: "con-6",
      toName: "Samantha Torres",
      relationshipType: "email_history",
      strengthScore: 68,
      evidence: "Collaborated on a joint GTM webinar in Q3 2025.",
      source: "Gmail",
      lastInteractionAt: d(50),
    },
    {
      id: "re-19",
      fromType: "contact",
      fromId: "con-4",
      fromName: "James Park",
      toType: "contact",
      toId: "con-9",
      toName: "Tom Nakamura",
      relationshipType: "intro_history",
      strengthScore: 85,
      evidence: "James introduced Amir to a VC in 2024 strong mutual trust.",
      source: "Email",
      lastInteractionAt: d(35),
    },
    {
      id: "re-20",
      fromType: "contact",
      fromId: "con-11",
      fromName: "Kevin Zhang",
      toType: "contact",
      toId: "con-12",
      toName: "Nina Okoye",
      relationshipType: "email_history",
      strengthScore: 72,
      evidence: "Worked together at DataBricks before Kevin moved to Northstar.",
      source: "Gmail",
      lastInteractionAt: d(70),
    },
    {
      id: "re-21",
      fromType: "team_member",
      fromId: "tm-4",
      fromName: "Maya Iyer",
      toType: "contact",
      toId: "con-5",
      toName: "David Kim",
      relationshipType: "calendar_meeting",
      strengthScore: 78,
      evidence: "Met at a16z portfolio event. Had a 1:1 discovery call.",
      source: "Google Calendar",
      lastInteractionAt: d(20),
    },
    {
      id: "re-22",
      fromType: "team_member",
      fromId: "tm-2",
      fromName: "Sarah Chen",
      toType: "contact",
      toId: "con-3",
      toName: "Elena Rodriguez",
      relationshipType: "intro_history",
      strengthScore: 88,
      evidence: "Sarah introduced Elena to a Salesforce partner.",
      source: "Gmail",
      lastInteractionAt: d(10),
    },
    {
      id: "re-23",
      fromType: "team_member",
      fromId: "tm-3",
      fromName: "Rohan Mehta",
      toType: "contact",
      toId: "con-6",
      toName: "Samantha Torres",
      relationshipType: "linkedin_connection",
      strengthScore: 60,
      evidence: "Connected after a Product Hunt launch. Occasional LinkedIn interaction.",
      source: "LinkedIn",
      lastInteractionAt: d(95),
    },
  ];

  for (const e of edgeDefs) {
    await prisma.relationshipEdge.upsert({
      where: { id: e.id },
      update: {},
      create: { ...e, workspaceId: workspace.id },
    });
  }

  console.log(`  ✓ Relationship edges: ${edgeDefs.length}`);

  // ── 8. Warm Paths ─────────────────────────────────────────────────────────
  const warmPathDefs = [
    {
      id: "wp-1",
      accountId: "acc-1",
      contactId: "con-1",
      pathJson: JSON.stringify([
        { id: "user-1", name: "Adhik Agarwal", type: "user" },
        { id: "tm-2", name: "Sarah Chen", type: "team_member" },
        { id: "con-1", name: "Priya Sharma", type: "contact" },
      ]),
      explanation:
        "Sarah Chen (your advisor, ex-Salesforce) is directly connected to Priya on LinkedIn.",
      warmthScore: 87,
      confidenceScore: 92,
      recommendedIntroPerson: "Sarah Chen",
      recommendedChannel: "email",
      status: "active",
    },
    {
      id: "wp-2",
      accountId: "acc-2",
      contactId: "con-3",
      pathJson: JSON.stringify([
        { id: "user-1", name: "Adhik Agarwal", type: "user" },
        { id: "tm-3", name: "Rohan Mehta", type: "team_member" },
        { id: "con-3", name: "Elena Rodriguez", type: "contact" },
      ]),
      explanation:
        "Rohan exchanged emails with Elena at YC in 2024. Direct warm connection via email history.",
      warmthScore: 78,
      confidenceScore: 85,
      recommendedIntroPerson: "Rohan Mehta",
      recommendedChannel: "email",
      status: "intro_sent",
    },
    {
      id: "wp-3",
      accountId: "acc-4",
      contactId: "con-7",
      pathJson: JSON.stringify([
        { id: "user-1", name: "Adhik Agarwal", type: "user" },
        { id: "con-7", name: "Liam Chen", type: "contact" },
      ]),
      explanation:
        "Direct connection you met Liam at SaaStr Annual 2025 and had a follow-up call.",
      warmthScore: 91,
      confidenceScore: 97,
      recommendedIntroPerson: "You (Adhik)",
      recommendedChannel: "email",
      status: "message_sent",
    },
    {
      id: "wp-4",
      accountId: "acc-5",
      contactId: "con-8",
      pathJson: JSON.stringify([
        { id: "user-1", name: "Adhik Agarwal", type: "user" },
        { id: "tm-2", name: "Sarah Chen", type: "team_member" },
        { id: "con-8", name: "Aisha Patel", type: "contact" },
      ]),
      explanation:
        "Sarah worked with Aisha at Salesforce Data Cloud for 2 years. Close working relationship.",
      warmthScore: 88,
      confidenceScore: 94,
      recommendedIntroPerson: "Sarah Chen",
      recommendedChannel: "email",
      status: "active",
    },
    {
      id: "wp-5",
      accountId: "acc-8",
      contactId: "con-11",
      pathJson: JSON.stringify([
        { id: "user-1", name: "Adhik Agarwal", type: "user" },
        { id: "tm-3", name: "Rohan Mehta", type: "team_member" },
        { id: "con-11", name: "Kevin Zhang", type: "contact" },
      ]),
      explanation:
        "Kevin just moved to TalentGrid. Rohan had a previous demo call with him at Northstar.",
      warmthScore: 75,
      confidenceScore: 88,
      recommendedIntroPerson: "Rohan Mehta",
      recommendedChannel: "email",
      status: "active",
    },
  ];

  for (const wp of warmPathDefs) {
    await prisma.warmPath.upsert({
      where: { id: wp.id },
      update: {},
      create: { ...wp, workspaceId: workspace.id },
    });
  }

  console.log(`  ✓ Warm paths: ${warmPathDefs.length}`);

  // ── 9. Messages (for approval queue) ─────────────────────────────────────
  const messageDefs = [
    {
      id: "msg-1",
      accountId: "acc-1",
      contactId: "con-1",
      warmPathId: "wp-1",
      signalId: "sig-1",
      channel: "warm_intro",
      subject: "[Intro request] Priya at Acme outbound scaling question",
      body: `Hey Sarah,\n\nHope you're well! Quick ask I noticed you're connected to Priya Sharma (VP Sales at Acme AI).\n\nThey just posted 4 SDR roles and a RevOps Manager, which looks like they're building out their outbound motion. I'd love a quick intro we've been helping similar teams set up warm outbound at scale, and the timing seems right.\n\nWould you be comfortable connecting us?\n\nThanks!\nAdhik`,
      status: "draft",
      approvalStatus: "pending",
      generatedByAi: true,
      confidenceScore: 91,
      personalizationReason:
        "Sarah has a direct LinkedIn connection to Priya. Acme posted 4 SDR roles (high hiring signal).",
      factualClaimsJson: JSON.stringify([
        "Acme AI posted 4 SDR roles on LinkedIn in the last 7 days",
      ]),
      supportingSourcesJson: JSON.stringify(["LinkedIn Jobs (verified 2h ago)"]),
      riskFlagsJson: JSON.stringify([]),
    },
    {
      id: "msg-2",
      accountId: "acc-2",
      contactId: "con-3",
      warmPathId: "wp-2",
      signalId: "sig-2",
      channel: "email",
      subject: "Finpilot + warm outbound saw you on the pricing page",
      body: `Hey Elena,\n\nRohan mentioned you two crossed paths at YC he said great things.\n\nNoticed Finpilot visited our pricing page a couple times this week, so the timing felt right to reach out.\n\nWe help B2B SaaS teams like Finpilot turn cold outbound into warm intros.\n\nWould a 20-min call make sense this week?\n\nAdhik`,
      status: "draft",
      approvalStatus: "pending",
      generatedByAi: true,
      confidenceScore: 87,
      personalizationReason:
        "Website visit signal creates urgency. Rohan's YC connection adds warmth.",
      factualClaimsJson: JSON.stringify(["Finpilot visited pricing page twice this week"]),
      supportingSourcesJson: JSON.stringify(["Website analytics (verified today)"]),
      riskFlagsJson: JSON.stringify([]),
    },
    {
      id: "msg-3",
      accountId: "acc-3",
      contactId: "con-5",
      signalId: "sig-3",
      channel: "email",
      subject: "Congrats on the Series A scaling outbound?",
      body: `Hi David,\n\nCongrats on the $12M Series A impressive round, especially with Bessemer involved.\n\nWhen companies at RevScale's stage raise and plan to 3x GTM, the first bottleneck is usually outbound quality.\n\nWould love 15 minutes to show you what WarmPath looks like in practice.\n\nAdhik`,
      status: "draft",
      approvalStatus: "pending",
      generatedByAi: true,
      confidenceScore: 93,
      personalizationReason: "Funding signal creates urgency. RevScale is ICP-perfect.",
      factualClaimsJson: JSON.stringify(["RevScale raised $12M Series A led by Bessemer"]),
      supportingSourcesJson: JSON.stringify(["TechCrunch (verified 36h ago)"]),
      riskFlagsJson: JSON.stringify([]),
    },
    {
      id: "msg-4",
      accountId: "acc-7",
      contactId: "con-10",
      signalId: "sig-7",
      channel: "email",
      subject: "Building your sales team at BrightOps warm outbound angle",
      body: `Hi Rachel,\n\nI've been following BrightOps the positioning around RevOps automation is sharp.\n\nNoticed you're hiring 3 AEs and a Sales Engineer, which tells me you're building an outbound motion from scratch. That's exactly the moment where the tools you choose matter most.\n\nHappy to show you a 15-min demo.\n\nAdhik`,
      status: "approved",
      approvalStatus: "approved",
      generatedByAi: true,
      confidenceScore: 89,
      personalizationReason:
        "BrightOps is a RevOps company perfect ICP. Hiring signal shows immediate need.",
      factualClaimsJson: JSON.stringify([
        "BrightOps posted 3 AE roles and a Sales Engineer on LinkedIn",
      ]),
      supportingSourcesJson: JSON.stringify(["LinkedIn Jobs (verified 6h ago)"]),
      riskFlagsJson: JSON.stringify([]),
    },
  ];

  for (const m of messageDefs) {
    await prisma.message.upsert({
      where: { id: m.id },
      update: {},
      create: { ...m, workspaceId: workspace.id },
    });
  }

  // Create approval records for pending messages
  for (const m of messageDefs.filter((m) => m.approvalStatus === "pending")) {
    const existing = await prisma.approval.findFirst({ where: { messageId: m.id } });
    if (!existing) {
      await prisma.approval.create({
        data: {
          workspaceId: workspace.id,
          messageId: m.id,
          userId: demoUser.id,
          status: "pending",
        },
      });
    }
  }

  console.log(`  ✓ Messages: ${messageDefs.length}`);

  // ── 10. Campaigns ─────────────────────────────────────────────────────────
  const campaignDefs = [
    {
      id: "camp-1",
      name: "Series A Funded Companies GTM Scaling",
      goal: "Book discovery calls with recently-funded B2B SaaS companies building outbound",
      status: "active",
      targetSegment: "Series A companies in B2B SaaS, 50–250 employees, hiring SDRs",
      channelsJson: JSON.stringify(["email", "linkedin"]),
      steps: [
        {
          id: "cs-1",
          stepNumber: 1,
          channel: "warm_intro",
          delayDays: 0,
          assetType: "warm_intro_request",
        },
        {
          id: "cs-2",
          stepNumber: 2,
          channel: "email",
          delayDays: 2,
          assetType: "prospect_outreach",
        },
        { id: "cs-3", stepNumber: 3, channel: "linkedin", delayDays: 4, assetType: "linkedin_dm" },
        { id: "cs-4", stepNumber: 4, channel: "email", delayDays: 7, assetType: "value_add" },
        { id: "cs-5", stepNumber: 5, channel: "email", delayDays: 14, assetType: "breakup" },
      ],
    },
    {
      id: "camp-2",
      name: "Hiring Signal SDR & RevOps Roles",
      goal: "Reach companies actively hiring sales/RevOps talent as a buying signal",
      status: "active",
      targetSegment: "Companies hiring 2+ SDRs or RevOps roles in the last 30 days",
      channelsJson: JSON.stringify(["email"]),
      steps: [
        {
          id: "cs-6",
          stepNumber: 1,
          channel: "email",
          delayDays: 0,
          assetType: "prospect_outreach",
        },
        { id: "cs-7", stepNumber: 2, channel: "email", delayDays: 5, assetType: "follow_up" },
      ],
    },
    {
      id: "camp-3",
      name: "Champion Tracking Job Change Reactivation",
      goal: "Reach out to past champions who moved to new companies",
      status: "draft",
      targetSegment: "Contacts from past deals who changed jobs in the last 60 days",
      channelsJson: JSON.stringify(["email", "linkedin"]),
      steps: [
        {
          id: "cs-8",
          stepNumber: 1,
          channel: "email",
          delayDays: 0,
          assetType: "champion_reactivation",
        },
      ],
    },
  ];

  for (const c of campaignDefs) {
    await prisma.campaign.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        workspaceId: workspace.id,
        ownerId: demoUser.id,
        name: c.name,
        goal: c.goal,
        status: c.status,
        targetSegment: c.targetSegment,
        channelsJson: c.channelsJson,
      },
    });

    for (const step of c.steps) {
      await prisma.campaignStep.upsert({
        where: { id: step.id },
        update: {},
        create: { ...step, campaignId: c.id, approvalRequired: true },
      });
    }
  }

  console.log(`  ✓ Campaigns: ${campaignDefs.length}`);

  // ── 11. Knowledge Base ────────────────────────────────────────────────────
  const kbDefs = [
    {
      id: "kb-1",
      title: "WarmPath Product Overview",
      type: "product",
      content:
        "WarmPath is an AI GTM sales agent that turns cold prospects into warm intros by mapping your team's full relationship graph, detecting buying signals in real time, and routing outreach through the warmest path.",
      source: "Internal product team",
      tagsJson: JSON.stringify(["product", "overview", "pitch"]),
      confidenceScore: 98,
      approvedForAi: true,
      usedInMessages: 12,
    },
    {
      id: "kb-2",
      title: "Core Value Proposition Warm Path ROI",
      type: "value_prop",
      content:
        "Warm intros produce 5× higher reply rates and 3× higher close rates vs cold outbound (Gartner, 2025). WarmPath automates the warm-path discovery process finding the shortest relationship route between your team and any target prospect.",
      source: "Sales team + Gartner research",
      tagsJson: JSON.stringify(["value-prop", "roi", "stats"]),
      confidenceScore: 95,
      approvedForAi: true,
      usedInMessages: 18,
    },
    {
      id: "kb-3",
      title: "Pricing Growth Plan Details",
      type: "pricing",
      content:
        "Growth plan is $149/month. Includes: 50 target accounts, unlimited AI-generated messages, all 13 signal types, full relationship graph, campaign automation, Gmail + LinkedIn integration.",
      source: "Billing page",
      tagsJson: JSON.stringify(["pricing", "plans", "growth"]),
      confidenceScore: 100,
      approvedForAi: true,
      usedInMessages: 3,
    },
    {
      id: "kb-4",
      title: "Ideal Customer Profile (ICP)",
      type: "icp",
      content:
        "ICP: B2B SaaS companies, Series A through Series C, 50–500 employees, ARR $5M–$100M. Verticals: Sales Tech, RevOps, FinTech, Analytics, HR Tech, DevTools. Buyer personas: VP of Sales, CRO, Head of Revenue, Founder/CEO.",
      source: "GTM strategy doc",
      tagsJson: JSON.stringify(["icp", "buyer-persona", "target-market"]),
      confidenceScore: 92,
      approvedForAi: true,
      usedInMessages: 9,
    },
    {
      id: "kb-5",
      title: "Competitor Battlecard Apollo vs WarmPath",
      type: "competitor",
      content:
        "Apollo: Strong prospecting database, weak on relationship intelligence and warm routing. Apollo gives you emails; we give you warm intros. Key WarmPath advantages: relationship graph, warm-path routing, knowledge-grounded messages, human approval loop.",
      source: "Sales team competitive intelligence",
      tagsJson: JSON.stringify(["competitor", "apollo", "battlecard"]),
      confidenceScore: 88,
      approvedForAi: true,
      usedInMessages: 2,
    },
    {
      id: "kb-6",
      title: "Objection: 'We already have an AI SDR tool'",
      type: "objection",
      content:
        "Response: Most AI SDR tools are cold sequence automators they just send templated emails at scale. WarmPath is different: we map your team's relationship graph, find the warmest path to every prospect, and generate messages that reference those real relationships.",
      source: "Sales call recordings",
      tagsJson: JSON.stringify(["objection", "ai-sdr"]),
      confidenceScore: 90,
      approvedForAi: true,
      usedInMessages: 0,
    },
    {
      id: "kb-7",
      title: "Case Study SeriesAI (anonymized)",
      type: "case_study",
      content:
        "A Series A B2B SaaS company with 3 SDRs used WarmPath to increase outbound reply rates from 7% to 38% in 6 weeks. Key wins: (1) Found 14 warm paths through advisor network; (2) Triggered by funding signal, booked 3 meetings within 72h of a competitor's raise.",
      source: "Customer interview",
      tagsJson: JSON.stringify(["case-study", "roi", "success-story"]),
      confidenceScore: 96,
      approvedForAi: true,
      usedInMessages: 7,
    },
    {
      id: "kb-8",
      title: "Approved Claims Verified Statistics",
      type: "compliance",
      content:
        "APPROVED TO USE IN MESSAGES: (1) Warm intros produce 5× higher reply rates vs cold email (Gartner, 2025). (2) 47% close rate on deals that started with a warm introduction. (3) Setup takes under 5 minutes. (4) Human approval required before any message sends.",
      source: "Legal + marketing review",
      tagsJson: JSON.stringify(["compliance", "approved-claims", "stats"]),
      confidenceScore: 100,
      approvedForAi: true,
      usedInMessages: 15,
    },
    {
      id: "kb-9",
      title: "Banned Claims Do NOT Use",
      type: "compliance",
      content:
        "DO NOT USE IN ANY MESSAGES: (1) Never claim 'guaranteed results'. (2) Never state specific revenue numbers for unverified prospects. (3) Never claim 'AI replaces your SDRs'. (4) Never reference competitor products negatively by name without factual basis.",
      source: "Legal team",
      tagsJson: JSON.stringify(["compliance", "banned-claims", "legal"]),
      confidenceScore: 100,
      approvedForAi: false,
      usedInMessages: 0,
    },
    {
      id: "kb-10",
      title: "Sales Playbook Discovery Call Script",
      type: "playbook",
      content:
        "DISCOVERY CALL FRAMEWORK (SPICED for WarmPath): Situation: Walk me through your current outbound motion. Pain: What's your average reply rate? Impact: If reply rates doubled, what would that mean for pipeline? Critical event: Are you hiring more SDRs soon? Decision: Who else would be involved in evaluating a tool like this?",
      source: "Sales team",
      tagsJson: JSON.stringify(["playbook", "discovery", "call-script"]),
      confidenceScore: 85,
      approvedForAi: false,
      usedInMessages: 0,
    },
    {
      id: "kb-11",
      title: "Buyer Persona VP of Sales",
      type: "persona",
      content:
        "VP of Sales persona: Primary goal is pipeline and quota attainment. Frustrated by: poor SDR reply rates, manual prospecting, ramp time for new hires. Responds well to: ROI metrics, time-to-first-meeting, peer proof. Skeptical of: AI hype, tools that require RevOps to set up.",
      source: "Sales team + customer interviews",
      tagsJson: JSON.stringify(["persona", "vp-sales", "buyer"]),
      confidenceScore: 88,
      approvedForAi: true,
      usedInMessages: 4,
    },
    {
      id: "kb-12",
      title: "Email Example Funding Signal Trigger",
      type: "email_example",
      content:
        "Subject: Congrats on the raise scaling outbound?\n\nHi [Name],\n\nCongrats on the $[X]M [Series] impressive milestone, especially with [Lead VC] involved.\n\nWhen companies at [Company]'s stage raise and plan to grow GTM, the first bottleneck is usually outbound quality.",
      source: "Best-performing outreach examples",
      tagsJson: JSON.stringify(["email-example", "funding-trigger", "template"]),
      confidenceScore: 94,
      approvedForAi: true,
      usedInMessages: 6,
    },
  ];

  for (const kb of kbDefs) {
    await prisma.knowledgeBaseItem.upsert({
      where: { id: kb.id },
      update: {},
      create: { ...kb, workspaceId: workspace.id },
    });
  }

  console.log(`  ✓ Knowledge base: ${kbDefs.length} items`);

  // ── 12. Integrations ──────────────────────────────────────────────────────
  const integrationDefs = [
    {
      id: "int-1",
      provider: "gmail",
      channel: "email",
      displayName: "Gmail",
      description: "Send personalized emails directly from your Gmail account with tracking.",
      status: "connected",
      capabilitiesJson: JSON.stringify(["send_email", "track_opens", "track_clicks"]),
      iconColor: "#EA4335",
      demoMode: true,
      healthScore: 100,
    },
    {
      id: "int-2",
      provider: "outlook",
      channel: "email",
      displayName: "Outlook / Microsoft 365",
      description: "Connect your Outlook or Microsoft 365 account for enterprise email delivery.",
      status: "disconnected",
      capabilitiesJson: JSON.stringify(["send_email", "track_opens", "calendar_sync"]),
      iconColor: "#0078D4",
      demoMode: false,
    },
    {
      id: "int-3",
      provider: "twilio",
      channel: "phone",
      displayName: "Twilio Voice",
      description:
        "Outbound calling with AI-generated scripts, call recording, and outcome logging.",
      status: "connected",
      capabilitiesJson: JSON.stringify(["outbound_calls", "call_recording", "voicemail_drop"]),
      iconColor: "#F22F46",
      demoMode: true,
      healthScore: 95,
    },
    {
      id: "int-4",
      provider: "whatsapp_business",
      channel: "whatsapp",
      displayName: "WhatsApp Business",
      description: "Send template-approved WhatsApp messages for high-intent follow-ups.",
      status: "connected",
      capabilitiesJson: JSON.stringify(["template_messages", "opt_out_management"]),
      iconColor: "#25D366",
      demoMode: true,
      healthScore: 88,
    },
    {
      id: "int-5",
      provider: "telegram_bot",
      channel: "telegram",
      displayName: "Telegram Bot",
      description: "Reach prospects via Telegram DMs and community group announcements.",
      status: "connected",
      capabilitiesJson: JSON.stringify(["direct_message", "group_post"]),
      iconColor: "#26A5E4",
      demoMode: true,
      healthScore: 92,
    },
    {
      id: "int-6",
      provider: "linkedin_sales_nav",
      channel: "linkedin",
      displayName: "LinkedIn Sales Navigator",
      description: "Send LinkedIn DMs, InMails, and connection requests via Sales Navigator.",
      status: "connected",
      capabilitiesJson: JSON.stringify(["send_inmail", "connection_request", "profile_view"]),
      iconColor: "#0A66C2",
      demoMode: true,
      healthScore: 97,
    },
    {
      id: "int-7",
      provider: "meta_ads",
      channel: "meta_ads",
      displayName: "Meta Ads",
      description: "Run targeted LinkedIn and Facebook retargeting ads for your warm leads.",
      status: "disconnected",
      capabilitiesJson: JSON.stringify(["custom_audiences", "retargeting", "lookalike"]),
      iconColor: "#1877F2",
      demoMode: false,
    },
    {
      id: "int-8",
      provider: "hubspot",
      channel: "email",
      displayName: "HubSpot CRM",
      description: "Bi-directional sync with HubSpot contacts, companies, deals, and activity.",
      status: "connected",
      capabilitiesJson: JSON.stringify(["contact_sync", "deal_sync", "activity_log"]),
      iconColor: "#FF7A59",
      demoMode: true,
      healthScore: 90,
    },
  ];

  for (const int of integrationDefs) {
    await prisma.integrationConnection.upsert({
      where: { workspaceId_provider: { workspaceId: workspace.id, provider: int.provider } },
      update: {},
      create: { ...int, id: int.id, workspaceId: workspace.id },
    });
  }

  console.log(`  ✓ Integrations: ${integrationDefs.length}`);

  console.log("\n✅ Seed complete!");
  console.log("   Login: demo@warmpath.ai / demo123");
  console.log("   Or use the 'Continue with demo' button on the login page.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
