"use client";

import { create } from "zustand";
import { setAIMode } from "@/lib/ai";
import type {
  Account,
  AIUsageLog,
  AuditAction,
  AuditLog,
  CallTask,
  Campaign,
  CampaignAsset,
  CampaignRecommendation,
  ChannelIntegration,
  Contact,
  FollowUpTask,
  GeneratedMessage,
  GTMMission,
  KnowledgeBaseItem,
  MetaAdCampaign,
  RelationshipEdge,
  Signal,
  TeamMember,
  TelegramMessage,
  UserTestScenario,
  WarmPath,
  WhatsAppMessage,
  Workspace,
  WorkspaceAISettings,
  WorkspaceMember,
} from "@/types";

// ─── Default values ───────────────────────────────────────────────────────────

const DEFAULT_AI_SETTINGS: WorkspaceAISettings = {
  workspace_id: "",
  ai_mode: "mock",
  monthly_budget_usd: 50,
  usage_this_month_usd: 0,
  allow_remote_generation: false,
  require_approval_for_remote: true,
  fallback_to_mock: true,
  provider: "mock",
  model: "mock-v1",
};

const DEFAULT_WORKSPACE: Workspace = {
  id: "",
  name: "WarmPath",
  domain: "warmpath.ai",
  industry: "AI / Sales Tech",
  company_size: "1–10",
  website: "https://warmpath.ai",
  description: "",
  plan: "growth",
  onboarding_stage: "complete",
  created_at: new Date().toISOString(),
};

// ─── Store interface ──────────────────────────────────────────────────────────

interface SalesState {
  // Loading state
  initialized: boolean;
  loading: boolean;

  // Core CRM
  accounts: Account[];
  contacts: Contact[];
  signals: Signal[];
  warmPaths: WarmPath[];
  messages: GeneratedMessage[];
  campaigns: Campaign[];
  relationshipEdges: RelationshipEdge[];
  teamMembers: TeamMember[];

  // Omnichannel
  campaignAssets: CampaignAsset[];
  callTasks: CallTask[];
  whatsappMessages: WhatsAppMessage[];
  telegramMessages: TelegramMessage[];
  metaCampaigns: MetaAdCampaign[];
  integrations: ChannelIntegration[];
  campaignRecommendations: CampaignRecommendation[];
  gtmMissions: GTMMission[];

  // Workspace
  workspace: Workspace;
  workspaceMembers: WorkspaceMember[];

  // Knowledge Base
  kbItems: KnowledgeBaseItem[];

  // AI & Settings
  aiSettings: WorkspaceAISettings;
  aiUsageLogs: AIUsageLog[];

  // Audit
  auditLogs: AuditLog[];

  // Test Scenarios
  testScenarios: UserTestScenario[];

  // UI State
  approvalFilter: "pending" | "approved" | "rejected" | "sent" | "all";
  approvalChannelFilter:
    | "all"
    | "email"
    | "phone"
    | "whatsapp"
    | "telegram"
    | "linkedin"
    | "meta_ads";
  generatingIds: Set<string>;

  // Init
  initialize: () => Promise<void>;
  reset: () => void;

  // Actions UI filters
  setApprovalFilter: (f: SalesState["approvalFilter"]) => void;
  setApprovalChannelFilter: (f: SalesState["approvalChannelFilter"]) => void;

  // Actions Messages (optimistic + API)
  approveMessage: (id: string, editedBody?: string) => Promise<void>;
  rejectMessage: (id: string, reason?: string) => Promise<void>;
  regenerateMessage: (id: string) => Promise<void>;

  // Actions Campaign Assets (optimistic + API)
  approveCampaignAsset: (id: string) => Promise<void>;
  rejectCampaignAsset: (id: string) => Promise<void>;

  // Actions Call Tasks (local only no route yet)
  logCallOutcome: (id: string, outcome: CallTask["outcome"], notes?: string) => void;

  // Follow-up Tasks
  followUpTasks: FollowUpTask[];
  createFollowUpTask: (task: Omit<FollowUpTask, "id" | "created_at" | "status">) => void;
  completeFollowUpTask: (id: string) => void;
  dismissFollowUpTask: (id: string) => void;

  // Actions WhatsApp (local only)
  approveWhatsApp: (id: string) => void;

  // Actions Missions (local only)
  completeMission: (id: string) => void;
  dismissMission: (id: string) => void;

  // Actions Integrations (optimistic + API)
  toggleIntegrationDemo: (id: string) => Promise<void>;

  // Actions Knowledge Base (optimistic + API)
  addKBItem: (
    item: Omit<
      KnowledgeBaseItem,
      "id" | "workspace_id" | "created_at" | "updated_at" | "used_in_messages"
    >,
  ) => Promise<void>;
  updateKBItem: (id: string, updates: Partial<KnowledgeBaseItem>) => Promise<void>;
  deleteKBItem: (id: string) => Promise<void>;
  toggleKBItemApproval: (id: string) => Promise<void>;

  // Actions Audit (local only API route logs on the server side)
  logAuditEvent: (
    action: AuditAction,
    opts?: {
      entityType?: string;
      entityId?: string;
      entityName?: string;
      metadata?: Record<string, string | number | boolean>;
    },
  ) => void;

  // Actions AI Usage (local only)
  logAIUsage: (log: Omit<AIUsageLog, "id" | "created_at">) => void;

  // Actions AI Settings
  updateAISettings: (updates: Partial<WorkspaceAISettings>) => void;

  // Actions Test Scenarios
  updateTestScenario: (id: string, updates: Partial<UserTestScenario>) => void;

  // Actions Campaigns
  addCampaign: (campaign: Campaign) => void;

  // Actions Queue a newly composed message (client-side only)
  addMessageToQueue: (
    draft: Omit<GeneratedMessage, "id" | "contact" | "account" | "warm_path" | "signal">,
  ) => string;
}

// ─── Helper to map API shapes to frontend types ───────────────────────────────

// API routes return Prisma model shapes (camelCase DB fields).
// The frontend types use snake_case. We map them here.

function mapAccount(a: Record<string, unknown>): Account {
  return {
    id: a.id as string,
    name: a.name as string,
    domain: (a.domain as string) ?? "",
    industry: (a.industry as string) ?? "",
    employee_count: ((a.employee_count ?? a.employeeCount) as number) ?? 0,
    location: (a.location as string) ?? "",
    description: (a.description as string) ?? "",
    stage: (a.stage as Account["stage"]) ?? "prospect",
    fit_score: ((a.fit_score ?? a.fitScore) as number) ?? 0,
    intent_score: ((a.intent_score ?? a.intentScore) as number) ?? 0,
    warmth_score: ((a.warmth_score ?? a.warmthScore) as number) ?? 0,
    opportunity_score: ((a.opportunity_score ?? a.opportunityScore) as number) ?? 0,
    created_at: ((a.created_at ?? a.createdAt) as string) ?? new Date().toISOString(),
  };
}

function mapContact(c: Record<string, unknown>): Contact {
  return {
    id: c.id as string,
    account_id: ((c.account_id ?? c.accountId) as string) ?? "",
    name: c.name as string,
    email: (c.email as string) ?? "",
    title: (c.title as string) ?? "",
    linkedin_url: ((c.linkedin_url ?? c.linkedinUrl) as string) ?? undefined,
    seniority: (c.seniority as Contact["seniority"]) ?? "manager",
    department: (c.department as string) ?? "",
    persona: (c.persona as string) ?? "",
    fit_score: ((c.fit_score ?? c.fitScore) as number) ?? 0,
    warmth_score: ((c.warmth_score ?? c.warmthScore) as number) ?? 0,
    engagement_score: ((c.engagement_score ?? c.engagementScore) as number) ?? 0,
  };
}

function mapSignal(s: Record<string, unknown>): Signal {
  return {
    id: s.id as string,
    account_id: ((s.account_id ?? s.accountId) as string) ?? "",
    contact_id: ((s.contact_id ?? s.contactId) as string) ?? undefined,
    type: s.type as Signal["type"],
    title: s.title as string,
    description: (s.description as string) ?? "",
    source: (s.source as string) ?? undefined,
    source_url: ((s.source_url ?? s.sourceUrl) as string) ?? undefined,
    detected_at: ((s.detected_at ?? s.detectedAt) as string) ?? new Date().toISOString(),
    urgency_score: ((s.urgency_score ?? s.urgencyScore) as number) ?? 50,
    confidence_score: ((s.confidence_score ?? s.confidenceScore) as number) ?? 70,
    recommended_action: "Review and act on this signal",
  };
}

function mapWarmPath(wp: Record<string, unknown>): WarmPath {
  let pathNodes: WarmPath["path_nodes"] = [];
  if (Array.isArray(wp.path_nodes)) {
    pathNodes = wp.path_nodes as WarmPath["path_nodes"];
  } else {
    try {
      pathNodes = JSON.parse((wp.path_json ?? wp.pathJson) as string);
    } catch {}
  }
  return {
    id: wp.id as string,
    account_id: ((wp.account_id ?? wp.accountId) as string) ?? "",
    contact_id: ((wp.contact_id ?? wp.contactId) as string) ?? "",
    path_nodes: pathNodes,
    path_explanation: ((wp.path_explanation ?? wp.explanation) as string) ?? "",
    warmth_score: ((wp.warmth_score ?? wp.warmthScore) as number) ?? 0,
    confidence_score: ((wp.confidence_score ?? wp.confidenceScore) as number) ?? 0,
    recommended_intro_person:
      ((wp.recommended_intro_person ?? wp.recommendedIntroPerson) as string) ?? "",
    recommended_channel:
      ((wp.recommended_channel ?? wp.recommendedChannel) as WarmPath["recommended_channel"]) ??
      "email",
    status: (wp.status as WarmPath["status"]) ?? "active",
  };
}

function mapMessage(m: Record<string, unknown>): GeneratedMessage {
  const factualClaims: string[] = Array.isArray(m.factual_claims)
    ? (m.factual_claims as string[])
    : (() => {
        try {
          return JSON.parse((m.factual_claims_json ?? m.factualClaimsJson) as string);
        } catch {
          return [];
        }
      })();
  const supportingSources: string[] = Array.isArray(m.supporting_sources)
    ? (m.supporting_sources as string[])
    : (() => {
        try {
          return JSON.parse((m.supporting_sources_json ?? m.supportingSourcesJson) as string);
        } catch {
          return [];
        }
      })();
  const riskFlags: GeneratedMessage["risk_flags"] = Array.isArray(m.risk_flags)
    ? (m.risk_flags as GeneratedMessage["risk_flags"])
    : (() => {
        try {
          return JSON.parse((m.risk_flags_json ?? m.riskFlagsJson) as string);
        } catch {
          return [];
        }
      })();
  return {
    id: m.id as string,
    campaign_id: ((m.campaign_id ?? m.campaignId) as string) ?? undefined,
    account_id: ((m.account_id ?? m.accountId) as string) ?? "",
    contact_id: ((m.contact_id ?? m.contactId) as string) ?? "",
    warm_path_id: ((m.warm_path_id ?? m.warmPathId) as string) ?? undefined,
    signal_id: ((m.signal_id ?? m.signalId) as string) ?? undefined,
    channel: (m.channel as GeneratedMessage["channel"]) ?? "email",
    subject: (m.subject as string) ?? undefined,
    body: (m.body as string) ?? "",
    intro_request: ((m.intro_request ?? m.introRequest) as string) ?? undefined,
    status: (m.status as GeneratedMessage["status"]) ?? "draft",
    approval_status:
      ((m.approval_status ?? m.approvalStatus) as GeneratedMessage["approval_status"]) ?? "pending",
    scheduled_at: ((m.scheduled_at ?? m.scheduledAt) as string) ?? undefined,
    sent_at: ((m.sent_at ?? m.sentAt) as string) ?? undefined,
    generated_by_ai: ((m.generated_by_ai ?? m.generatedByAi) as boolean) ?? true,
    confidence_score: ((m.confidence_score ?? m.confidenceScore) as number) ?? 0,
    personalization_reason: ((m.personalization_reason ?? m.personalizationReason) as string) ?? "",
    factual_claims: factualClaims,
    supporting_sources: supportingSources,
    risk_flags: riskFlags,
  };
}

function mapCampaign(c: Record<string, unknown>): Campaign {
  const channels: string[] = Array.isArray(c.channels)
    ? (c.channels as string[])
    : (() => {
        try {
          return JSON.parse((c.channels_json ?? c.channelsJson) as string);
        } catch {
          return [];
        }
      })();
  return {
    id: c.id as string,
    user_id: ((c.user_id ?? c.owner_id ?? c.ownerId) as string) ?? "",
    name: c.name as string,
    goal: (c.goal as string) ?? "",
    status: (c.status as Campaign["status"]) ?? "draft",
    target_segment: ((c.target_segment ?? c.targetSegment) as string) ?? "",
    channels,
    created_at: ((c.created_at ?? c.createdAt) as string) ?? new Date().toISOString(),
    steps: ((c.steps as Record<string, unknown>[]) ?? []).map((s) => ({
      id: s.id as string,
      campaign_id: ((s.campaign_id ?? s.campaignId) as string) ?? "",
      step_number: ((s.step_number ?? s.stepNumber) as number) ?? 1,
      channel: (s.channel as CampaignStep["channel"]) ?? "email",
      delay_days: ((s.delay_days ?? s.delayDays) as number) ?? 0,
      template_type: ((s.template_type ?? s.asset_type ?? s.assetType) as string) ?? "",
      template_hint: ((s.template_hint ?? s.templateHint) as string) ?? "",
      objective: ((s.objective ?? s.action_type ?? s.actionType) as string) ?? "",
      is_ai_generated: ((s.is_ai_generated ?? s.isAiGenerated) as boolean) ?? true,
    })),
    stats: {
      total_prospects: 0,
      messages_sent: 0,
      replies: 0,
      meetings_booked: 0,
      reply_rate: 0,
      meeting_rate: 0,
    },
  };
}

function mapCampaignAsset(a: Record<string, unknown>): CampaignAsset {
  return {
    id: a.id as string,
    campaign_id: ((a.campaign_id ?? a.campaignId) as string) ?? "",
    channel: (a.channel as CampaignAsset["channel"]) ?? "email",
    type: (a.type as CampaignAsset["type"]) ?? "email",
    title: (a.title as string) ?? "",
    content: (a.content as string) ?? "",
    subject: (a.subject as string) ?? undefined,
    headline: (a.headline as string) ?? undefined,
    status: ((a.approval_status ?? a.approvalStatus) as CampaignAsset["status"]) ?? "draft",
    risk_score: ((a.risk_score ?? a.riskScore) as number) ?? 0,
    confidence_score: ((a.confidence_score ?? a.confidenceScore) as number) ?? 0,
    contact_id: ((a.contact_id ?? a.contactId) as string) ?? undefined,
    account_id: ((a.account_id ?? a.accountId) as string) ?? undefined,
    generated_by_ai: ((a.generated_by_ai ?? a.generatedByAi) as boolean) ?? true,
    created_at: ((a.created_at ?? a.createdAt) as string) ?? new Date().toISOString(),
  };
}

function mapKBItem(k: Record<string, unknown>): KnowledgeBaseItem {
  const tags: string[] = Array.isArray(k.tags)
    ? (k.tags as string[])
    : (() => {
        try {
          return JSON.parse((k.tags_json ?? k.tagsJson) as string);
        } catch {
          return [];
        }
      })();
  return {
    id: k.id as string,
    workspace_id: ((k.workspace_id ?? k.workspaceId) as string) ?? "",
    title: k.title as string,
    type: (k.type as KnowledgeBaseItem["type"]) ?? "custom",
    content: (k.content as string) ?? "",
    source: (k.source as string) ?? undefined,
    tags,
    confidence_score: ((k.confidence_score ?? k.confidenceScore) as number) ?? 80,
    approved_for_ai: ((k.approved_for_ai ?? k.approvedForAi) as boolean) ?? true,
    created_at: ((k.created_at ?? k.createdAt) as string) ?? new Date().toISOString(),
    updated_at: ((k.updated_at ?? k.updatedAt) as string) ?? new Date().toISOString(),
    used_in_messages: ((k.used_in_messages ?? k.usedInMessages) as number) ?? 0,
  };
}

function mapIntegration(i: Record<string, unknown>): ChannelIntegration {
  const capabilities: string[] = Array.isArray(i.capabilities)
    ? (i.capabilities as string[])
    : (() => {
        try {
          return JSON.parse((i.capabilities_json ?? i.capabilitiesJson) as string);
        } catch {
          return [];
        }
      })();
  return {
    id: i.id as string,
    workspace_id: ((i.workspace_id ?? i.workspaceId) as string) ?? "",
    channel: (i.channel as ChannelIntegration["channel"]) ?? "email",
    provider: (i.provider as ChannelIntegration["provider"]) ?? "gmail",
    status: (i.status as ChannelIntegration["status"]) ?? "disconnected",
    display_name: ((i.display_name ?? i.displayName) as string) ?? "",
    description: (i.description as string) ?? "",
    capabilities,
    connected_at: ((i.created_at ?? i.createdAt) as string) ?? undefined,
    last_sync_at: ((i.last_sync_at ?? i.lastSyncAt) as string) ?? undefined,
    health_score: ((i.health_score ?? i.healthScore) as number) ?? undefined,
    icon_color: ((i.icon_color ?? i.iconColor) as string) ?? "#666",
    demo_mode: ((i.demo_mode ?? i.demoMode) as boolean) ?? false,
  };
}

function mapAuditLog(l: Record<string, unknown>): AuditLog {
  const metadata: Record<string, string | number | boolean> | undefined =
    l.metadata !== null && typeof l.metadata === "object" && !Array.isArray(l.metadata)
      ? (l.metadata as Record<string, string | number | boolean>)
      : (() => {
          try {
            return JSON.parse((l.metadata_json ?? l.metadataJson) as string);
          } catch {
            return undefined;
          }
        })();
  return {
    id: l.id as string,
    workspace_id: ((l.workspace_id ?? l.workspaceId) as string) ?? "",
    actor_user_id: ((l.actor_user_id ?? l.actorUserId) as string) ?? "",
    actor_name: ((l.actor_name ?? l.actorName) as string) ?? "System",
    action: (l.action as AuditLog["action"]) ?? "settings.updated",
    entity_type: ((l.entity_type ?? l.entityType) as string) ?? undefined,
    entity_id: ((l.entity_id ?? l.entityId) as string) ?? undefined,
    entity_name: ((l.entity_name ?? l.entityName) as string) ?? undefined,
    metadata,
    created_at: ((l.created_at ?? l.createdAt) as string) ?? new Date().toISOString(),
  };
}

function mapAIUsageLog(l: Record<string, unknown>): AIUsageLog {
  return {
    id: l.id as string,
    workspace_id: ((l.workspace_id ?? l.workspaceId) as string) ?? "",
    user_id: ((l.user_id ?? l.userId) as string) ?? "",
    action_type:
      ((l.action_type ?? l.actionType) as AIUsageLog["action_type"]) ?? "generate_message",
    provider: (l.provider as AIUsageLog["provider"]) ?? "mock",
    model: (l.model as string) ?? "mock-v1",
    input_tokens: ((l.input_tokens ?? l.inputTokens) as number) ?? 0,
    output_tokens: ((l.output_tokens ?? l.outputTokens) as number) ?? 0,
    estimated_cost: ((l.estimated_cost ?? l.estimatedCost) as number) ?? 0,
    status: (l.status as AIUsageLog["status"]) ?? "success",
    created_at: ((l.created_at ?? l.createdAt) as string) ?? new Date().toISOString(),
    cache_hit: ((l.cache_hit ?? l.cacheHit) as boolean) ?? false,
  };
}

function mapTask(t: Record<string, unknown>): FollowUpTask {
  const validTypes: FollowUpTask["type"][] = [
    "follow_up",
    "reply_check",
    "meeting_prep",
    "intro_send",
    "manual",
  ];
  const rawType = (t.type as string) ?? "manual";
  const type: FollowUpTask["type"] = validTypes.includes(rawType as FollowUpTask["type"])
    ? (rawType as FollowUpTask["type"])
    : "manual";
  const validStatuses: FollowUpTask["status"][] = ["pending", "completed", "dismissed"];
  const rawStatus = (t.status as string) ?? "pending";
  const status: FollowUpTask["status"] = validStatuses.includes(rawStatus as FollowUpTask["status"])
    ? (rawStatus as FollowUpTask["status"])
    : "pending";
  return {
    id: t.id as string,
    type,
    status,
    title: t.title as string,
    description: (t.description as string) ?? "",
    due_date: ((t.due_at ?? t.dueAt) as string) ?? new Date().toISOString(),
    created_at: ((t.created_at ?? t.createdAt) as string) ?? new Date().toISOString(),
  };
}

function mapRelationshipEdge(e: Record<string, unknown>): RelationshipEdge {
  return {
    id: e.id as string,
    from_type: ((e.from_type ?? e.fromType) as RelationshipEdge["from_type"]) ?? "contact",
    from_id: ((e.from_id ?? e.fromId) as string) ?? "",
    from_name: ((e.from_name ?? e.fromName) as string) ?? "",
    to_type: ((e.to_type ?? e.toType) as RelationshipEdge["to_type"]) ?? "contact",
    to_id: ((e.to_id ?? e.toId) as string) ?? "",
    to_name: ((e.to_name ?? e.toName) as string) ?? "",
    relationship_type:
      ((e.relationship_type ?? e.relationshipType) as RelationshipEdge["relationship_type"]) ??
      "linkedin_connection",
    strength_score: ((e.strength_score ?? e.strengthScore) as number) ?? 50,
    evidence: (e.evidence as string) ?? "",
    source: (e.source as string) ?? "",
    last_interaction_at:
      ((e.last_interaction_at ?? e.lastInteractionAt) as string) ?? new Date().toISOString(),
  };
}

// Needed so TypeScript knows the type exists; Campaign has steps
import type { CampaignStep } from "@/types";

// ─── Store ────────────────────────────────────────────────────────────────────

let auditCounter = 0;

export const useSalesStore = create<SalesState>()((set, get) => ({
  initialized: false,
  loading: false,

  accounts: [],
  contacts: [],
  signals: [],
  warmPaths: [],
  messages: [],
  campaigns: [],
  relationshipEdges: [],
  teamMembers: [],
  campaignAssets: [],
  callTasks: [],
  whatsappMessages: [],
  telegramMessages: [],
  metaCampaigns: [],
  integrations: [],
  campaignRecommendations: [],
  gtmMissions: [],
  workspace: DEFAULT_WORKSPACE,
  workspaceMembers: [],
  kbItems: [],
  aiSettings: DEFAULT_AI_SETTINGS,
  aiUsageLogs: [],
  auditLogs: [],
  testScenarios: [],
  followUpTasks: [],
  approvalFilter: "pending",
  approvalChannelFilter: "all",
  generatingIds: new Set<string>(),

  // ─── Initialize: fetch all data from API ─────────────────────────────────

  initialize: async () => {
    if (get().initialized || get().loading) return;
    set({ loading: true });

    try {
      const [
        accountsRes,
        contactsRes,
        signalsRes,
        warmPathsRes,
        campaignsRes,
        approvalsRes,
        kbRes,
        integrationsRes,
        auditRes,
        aiUsageRes,
        workspaceRes,
        edgesRes,
        tasksRes,
      ] = await Promise.allSettled([
        fetch("/api/accounts").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/contacts").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/signals").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/warm-paths").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/campaigns").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/messages").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/knowledge-base").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/integrations").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/audit-log").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/ai-usage").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/workspaces/current").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/relationship-edges").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/tasks").then((r) => (r.ok ? r.json() : [])),
      ]);

      const val = <T>(r: PromiseSettledResult<T>, fallback: T): T =>
        r.status === "fulfilled" ? r.value : fallback;

      const rawAccounts = val(accountsRes, []) as Record<string, unknown>[];
      const rawContacts = val(contactsRes, []) as Record<string, unknown>[];
      const rawSignals = val(signalsRes, []) as Record<string, unknown>[];
      const rawWarmPaths = val(warmPathsRes, []) as Record<string, unknown>[];
      const rawCampaigns = val(campaignsRes, []) as Record<string, unknown>[];
      const rawMessages = val(approvalsRes, []) as Record<string, unknown>[];
      const rawKB = val(kbRes, []) as Record<string, unknown>[];
      const rawIntegrations = val(integrationsRes, []) as Record<string, unknown>[];
      const rawAudit = val(auditRes, []) as Record<string, unknown>[];
      const rawAIUsage = val(aiUsageRes, []) as Record<string, unknown>[];
      const rawWorkspace = val(workspaceRes, null) as Record<string, unknown> | null;
      const rawEdges = val(edgesRes, []) as Record<string, unknown>[];
      const rawTasks = val(tasksRes, []) as Record<string, unknown>[];

      const workspaceMembers: WorkspaceMember[] = rawWorkspace?.members
        ? (rawWorkspace.members as Record<string, unknown>[]).map((m) => ({
            id: m.id as string,
            workspace_id: ((m.workspace_id ?? m.workspaceId) as string) ?? "",
            user_id: ((m.user_id ?? m.userId) as string) ?? "",
            name:
              (m.name as string) ??
              ((m.user as Record<string, unknown>)?.name as string) ??
              "Team Member",
            email:
              (m.email as string) ?? ((m.user as Record<string, unknown>)?.email as string) ?? "",
            role: (m.role as WorkspaceMember["role"]) ?? "sales_rep",
            joined_at: ((m.joined_at ?? m.joinedAt) as string) ?? new Date().toISOString(),
            title: (m.title as string) ?? undefined,
            connected_sources: [],
            relationship_score: ((m.relationship_score ?? m.relationshipScore) as number) ?? 0,
          }))
        : [];

      const teamMembers: TeamMember[] = workspaceMembers.map((wm) => ({
        id: wm.user_id,
        user_id: wm.user_id,
        name: wm.name,
        email: wm.email,
        title: wm.title ?? "",
        connected_sources: wm.connected_sources,
        relationship_score: wm.relationship_score,
      }));

      const workspaceData: Workspace = rawWorkspace
        ? {
            id: rawWorkspace.id as string,
            name: (rawWorkspace.name as string) ?? "WarmPath",
            domain: (rawWorkspace.domain as string) ?? "",
            industry: (rawWorkspace.industry as string) ?? "",
            company_size: ((rawWorkspace.company_size ?? rawWorkspace.companySize) as string) ?? "",
            website: (rawWorkspace.website as string) ?? "",
            description: (rawWorkspace.description as string) ?? "",
            plan: (rawWorkspace.plan as Workspace["plan"]) ?? "growth",
            onboarding_stage:
              ((rawWorkspace.onboarding_stage ??
                rawWorkspace.onboardingStage) as Workspace["onboarding_stage"]) ?? "complete",
            created_at:
              ((rawWorkspace.created_at ?? rawWorkspace.createdAt) as string) ??
              new Date().toISOString(),
          }
        : DEFAULT_WORKSPACE;

      set({
        accounts: rawAccounts.map(mapAccount),
        contacts: rawContacts.map(mapContact),
        signals: rawSignals.map(mapSignal),
        warmPaths: rawWarmPaths.map(mapWarmPath),
        campaigns: rawCampaigns.map(mapCampaign),
        messages: rawMessages.map(mapMessage),
        campaignAssets: [],
        kbItems: rawKB.map(mapKBItem),
        integrations: rawIntegrations.map(mapIntegration),
        auditLogs: rawAudit.map(mapAuditLog),
        aiUsageLogs: rawAIUsage.map(mapAIUsageLog),
        relationshipEdges: rawEdges.map(mapRelationshipEdge),
        followUpTasks: rawTasks.map(mapTask),
        workspace: workspaceData,
        workspaceMembers,
        teamMembers,
        initialized: true,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  reset: () =>
    set({
      initialized: false,
      accounts: [],
      contacts: [],
      signals: [],
      warmPaths: [],
      messages: [],
      campaigns: [],
      campaignAssets: [],
      kbItems: [],
      integrations: [],
      auditLogs: [],
      aiUsageLogs: [],
      followUpTasks: [],
    }),

  // ─── UI filters ───────────────────────────────────────────────────────────

  setApprovalFilter: (f) => set({ approvalFilter: f }),
  setApprovalChannelFilter: (f) => set({ approvalChannelFilter: f }),

  // ─── Messages ─────────────────────────────────────────────────────────────

  approveMessage: async (id, editedBody) => {
    // Optimistic update
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id
          ? { ...m, approval_status: "approved", status: "queued", body: editedBody ?? m.body }
          : m,
      ),
    }));
    try {
      await fetch(`/api/approvals/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "message", editedBody }),
      });
    } catch {
      // Revert optimistic update on failure
      await get().initialize();
    }
    get().logAuditEvent("message.approved", {
      entityType: "message",
      entityId: id,
      metadata: { edit_made: !!editedBody },
    });
  },

  rejectMessage: async (id) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, approval_status: "rejected", status: "draft" } : m,
      ),
    }));
    try {
      await fetch(`/api/approvals/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "message" }),
      });
    } catch {
      await get().initialize();
    }
    get().logAuditEvent("message.rejected", { entityType: "message", entityId: id });
  },

  regenerateMessage: async (id) => {
    const state = get();
    const msg = state.messages.find((m) => m.id === id);
    if (!msg) return;

    set((s) => ({ generatingIds: new Set([...s.generatingIds, id]) }));

    try {
      const res = await fetch("/api/ai/generate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: msg.account_id,
          contactId: msg.contact_id,
          signalId: msg.signal_id,
          warmPathId: msg.warm_path_id,
          channel: msg.channel,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id
              ? {
                  ...m,
                  body: result.body,
                  subject: result.subject ?? m.subject,
                  intro_request: result.intro_request ?? m.intro_request,
                  approval_status: "pending",
                  confidence_score: result.confidence_score,
                  personalization_reason: result.personalization_reason,
                  factual_claims: result.factual_claims ?? [],
                  supporting_sources: result.supporting_sources ?? [],
                  risk_flags: [],
                }
              : m,
          ),
        }));
        get().logAuditEvent("message.regenerated", { entityType: "message", entityId: id });
      }
    } finally {
      set((s) => ({
        generatingIds: new Set([...s.generatingIds].filter((x) => x !== id)),
      }));
    }
  },

  // ─── Campaign Assets ──────────────────────────────────────────────────────

  approveCampaignAsset: async (id) => {
    set((state) => ({
      campaignAssets: state.campaignAssets.map((a) =>
        a.id === id ? { ...a, status: "approved" as const } : a,
      ),
    }));
    try {
      await fetch(`/api/approvals/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "asset" }),
      });
    } catch {
      await get().initialize();
    }
    get().logAuditEvent("message.approved", { entityType: "campaign_asset", entityId: id });
  },

  rejectCampaignAsset: async (id) => {
    set((state) => ({
      campaignAssets: state.campaignAssets.map((a) =>
        a.id === id ? { ...a, status: "rejected" as const } : a,
      ),
    }));
    try {
      await fetch(`/api/approvals/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "asset" }),
      });
    } catch {
      await get().initialize();
    }
    get().logAuditEvent("message.rejected", { entityType: "campaign_asset", entityId: id });
  },

  // ─── Call Tasks (local only) ──────────────────────────────────────────────

  logCallOutcome: (id, outcome, notes) => {
    set((state) => ({
      callTasks: state.callTasks.map((c) =>
        c.id === id
          ? {
              ...c,
              outcome,
              outcome_notes: notes,
              status: "completed" as const,
              completed_at: new Date().toISOString(),
            }
          : c,
      ),
    }));
    get().logAuditEvent("message.approved", {
      entityType: "call_task",
      entityId: id,
      metadata: { outcome: outcome ?? "" },
    });
  },

  approveWhatsApp: (id) => {
    set((state) => ({
      whatsappMessages: state.whatsappMessages.map((w) =>
        w.id === id ? { ...w, status: "approved" as const } : w,
      ),
    }));
    get().logAuditEvent("message.approved", { entityType: "whatsapp_message", entityId: id });
  },

  // ─── Follow-up Tasks ──────────────────────────────────────────────────────

  createFollowUpTask: (task) => {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newTask = { ...task, id, status: "pending" as const, created_at: new Date().toISOString() };
    set((state) => ({
      followUpTasks: [...state.followUpTasks, newTask],
    }));
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: task.type,
        title: task.title,
        description: task.description,
        status: "pending",
        priority: "medium",
      }),
    }).catch(() => {}); // fire-and-forget
  },

  completeFollowUpTask: (id) => {
    set((state) => ({
      followUpTasks: state.followUpTasks.map((t) =>
        t.id === id
          ? { ...t, status: "completed" as const, completed_at: new Date().toISOString() }
          : t,
      ),
    }));
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    }).catch(() => {}); // fire-and-forget
  },

  dismissFollowUpTask: (id) => {
    set((state) => ({
      followUpTasks: state.followUpTasks.map((t) =>
        t.id === id ? { ...t, status: "dismissed" as const } : t,
      ),
    }));
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dismissed" }),
    }).catch(() => {}); // fire-and-forget
  },

  // ─── Missions ─────────────────────────────────────────────────────────────

  completeMission: (id) => {
    set((state) => ({
      gtmMissions: state.gtmMissions.map((m) =>
        m.id === id ? { ...m, status: "completed" as const, progress: m.total } : m,
      ),
    }));
  },

  dismissMission: (id) => {
    set((state) => ({
      gtmMissions: state.gtmMissions.map((m) =>
        m.id === id ? { ...m, status: "dismissed" as const } : m,
      ),
    }));
  },

  // ─── Integrations ─────────────────────────────────────────────────────────

  toggleIntegrationDemo: async (id) => {
    const integration = get().integrations.find((i) => i.id === id);
    if (!integration) return;

    const isConnecting = !integration.demo_mode;
    // Optimistic update
    set((state) => ({
      integrations: state.integrations.map((i) =>
        i.id === id
          ? { ...i, demo_mode: !i.demo_mode, status: isConnecting ? "demo" : "disconnected" }
          : i,
      ),
    }));
    try {
      const endpoint = isConnecting
        ? `/api/integrations/${id}/connect-demo`
        : `/api/integrations/${id}/disconnect`;
      await fetch(endpoint, { method: "POST" });
    } catch {
      // Revert
      set((state) => ({
        integrations: state.integrations.map((i) =>
          i.id === id ? { ...i, demo_mode: !isConnecting } : i,
        ),
      }));
    }
  },

  // ─── Knowledge Base ───────────────────────────────────────────────────────

  addKBItem: async (item) => {
    const res = await fetch("/api/knowledge-base", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, tags: item.tags }),
    });
    if (res.ok) {
      const created = await res.json();
      const newItem = mapKBItem(created);
      set((state) => ({ kbItems: [...state.kbItems, newItem] }));
      get().logAuditEvent("kb.item_added", {
        entityType: "kb_item",
        entityId: newItem.id,
        entityName: newItem.title,
      });
    }
  },

  updateKBItem: async (id, updates) => {
    set((state) => ({
      kbItems: state.kbItems.map((k) =>
        k.id === id ? { ...k, ...updates, updated_at: new Date().toISOString() } : k,
      ),
    }));
    try {
      await fetch(`/api/knowledge-base/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch {
      await get().initialize();
    }
    const item = get().kbItems.find((k) => k.id === id);
    get().logAuditEvent("kb.item_updated", {
      entityType: "kb_item",
      entityId: id,
      entityName: item?.title,
    });
  },

  deleteKBItem: async (id) => {
    const item = get().kbItems.find((k) => k.id === id);
    set((state) => ({ kbItems: state.kbItems.filter((k) => k.id !== id) }));
    try {
      await fetch(`/api/knowledge-base/${id}`, { method: "DELETE" });
    } catch {
      await get().initialize();
    }
    get().logAuditEvent("kb.item_deleted", {
      entityType: "kb_item",
      entityId: id,
      entityName: item?.title,
    });
  },

  toggleKBItemApproval: async (id) => {
    const item = get().kbItems.find((k) => k.id === id);
    if (!item) return;
    // Optimistic
    set((state) => ({
      kbItems: state.kbItems.map((k) =>
        k.id === id
          ? { ...k, approved_for_ai: !k.approved_for_ai, updated_at: new Date().toISOString() }
          : k,
      ),
    }));
    try {
      await fetch(`/api/knowledge-base/${id}/toggle-approval`, { method: "POST" });
    } catch {
      await get().initialize();
    }
    get().logAuditEvent("kb.item_approved", {
      entityType: "kb_item",
      entityId: id,
      entityName: item.title,
      metadata: { new_status: !item.approved_for_ai },
    });
  },

  // ─── Audit (local append server already writes on API calls) ────────────

  logAuditEvent: (action, opts = {}) => {
    const log: AuditLog = {
      id: `al-local-${++auditCounter}`,
      workspace_id: get().workspace.id || "ws-demo",
      actor_user_id: "current-user",
      actor_name: "You",
      action,
      entity_type: opts.entityType,
      entity_id: opts.entityId,
      entity_name: opts.entityName,
      metadata: opts.metadata,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ auditLogs: [log, ...state.auditLogs] }));
  },

  logAIUsage: (log) => {
    const entry: AIUsageLog = {
      ...log,
      id: `au-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ aiUsageLogs: [entry, ...state.aiUsageLogs] }));
  },

  updateAISettings: (updates) => {
    set((state) => ({ aiSettings: { ...state.aiSettings, ...updates } }));
    if (updates.ai_mode) setAIMode(updates.ai_mode);
    get().logAuditEvent("settings.updated", {
      entityType: "ai_settings",
      metadata: updates as Record<string, string | number | boolean>,
    });
  },

  updateTestScenario: (id, updates) => {
    set((state) => ({
      testScenarios: state.testScenarios.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  },

  addCampaign: (campaign) => {
    set((state) => ({ campaigns: [campaign, ...state.campaigns] }));
  },

  addMessageToQueue: (draft) => {
    const id = `msg-new-${Date.now()}`;
    const state = get();
    const contact = state.contacts.find((c) => c.id === draft.contact_id);
    const account = state.accounts.find((a) => a.id === draft.account_id);
    const warmPath = draft.warm_path_id
      ? state.warmPaths.find((wp) => wp.id === draft.warm_path_id)
      : undefined;
    const signal = draft.signal_id
      ? state.signals.find((s) => s.id === draft.signal_id)
      : undefined;
    const message: GeneratedMessage = {
      ...draft,
      id,
      contact,
      account,
      warm_path: warmPath,
      signal,
    };
    set((s) => ({ messages: [message, ...s.messages] }));
    get().logAuditEvent("message.generated", { entityType: "message", entityId: id });
    return id;
  },
}));
