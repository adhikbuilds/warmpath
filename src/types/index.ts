export type Plan = "free" | "growth" | "scale" | "enterprise";

export interface User {
  id: string;
  name: string;
  email: string;
  company_name: string;
  role: string;
  plan: Plan;
  onboarding_completed: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  title: string;
  connected_sources: string[];
  relationship_score: number;
  avatar_url?: string;
}

export interface Account {
  id: string;
  name: string;
  domain: string;
  industry: string;
  employee_count: number;
  location: string;
  description: string;
  stage: "prospect" | "engaged" | "meeting" | "proposal" | "closed_won" | "closed_lost";
  fit_score: number;
  intent_score: number;
  warmth_score: number;
  opportunity_score: number;
  logo_url?: string;
  created_at: string;
}

export interface Contact {
  id: string;
  account_id: string;
  name: string;
  email: string;
  title: string;
  linkedin_url?: string;
  seniority: "c_suite" | "vp" | "director" | "manager" | "ic";
  department: string;
  persona: string;
  fit_score: number;
  warmth_score: number;
  engagement_score: number;
  avatar_url?: string;
}

export type RelationshipType =
  | "email_history"
  | "linkedin_connection"
  | "crm_owner"
  | "calendar_meeting"
  | "intro_history"
  | "coworker_connection"
  | "warm_path";

export interface RelationshipEdge {
  id: string;
  from_type: "user" | "team_member" | "contact";
  from_id: string;
  from_name: string;
  to_type: "user" | "team_member" | "contact" | "account";
  to_id: string;
  to_name: string;
  relationship_type: RelationshipType;
  strength_score: number;
  evidence: string;
  source: string;
  last_interaction_at: string;
}

export interface WarmPath {
  id: string;
  account_id: string;
  contact_id: string;
  path_nodes: Array<{ id: string; name: string; type: "user" | "team_member" | "contact" }>;
  path_explanation: string;
  warmth_score: number;
  confidence_score: number;
  recommended_intro_person: string;
  recommended_channel: "email" | "linkedin" | "call";
  status: "active" | "intro_sent" | "intro_accepted" | "message_sent" | "replied";
}

export type SignalType =
  | "job_posting"
  | "funding"
  | "website_visit"
  | "pricing_page_visit"
  | "competitor_hiring"
  | "tech_stack_change"
  | "leadership_change"
  | "linkedin_post"
  | "product_launch"
  | "g2_review"
  | "champion_job_change"
  | "crm_stage_change"
  | "intent_topic_surge";

export interface Signal {
  id: string;
  account_id: string;
  contact_id?: string;
  type: SignalType;
  title: string;
  description: string;
  source?: string;
  source_url?: string;
  detected_at: string;
  urgency_score: number;
  confidence_score: number;
  recommended_action: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  goal: string;
  status: "draft" | "active" | "paused" | "completed";
  target_segment: string;
  channels: string[];
  created_at: string;
  steps: CampaignStep[];
  stats: {
    total_prospects: number;
    messages_sent: number;
    replies: number;
    meetings_booked: number;
    reply_rate: number;
    meeting_rate: number;
  };
}

export interface CampaignStep {
  id: string;
  campaign_id: string;
  step_number: number;
  channel: "email" | "linkedin" | "call" | "task" | "warm_intro";
  delay_days: number;
  template_type: string;
  template_hint: string;
  objective: string;
  is_ai_generated: boolean;
}

export type MessageStatus =
  | "draft"
  | "queued"
  | "approved"
  | "scheduled"
  | "sent"
  | "delivered"
  | "opened"
  | "replied"
  | "bounced"
  | "failed";

export type ApprovalStatus = "pending" | "approved" | "edited" | "rejected" | "scheduled";

export type RiskFlag =
  | "unsupported_claim"
  | "too_generic"
  | "too_long"
  | "too_salesy"
  | "possible_hallucination"
  | "compliance_sensitive"
  | "weak_personalization";

export interface GeneratedMessage {
  id: string;
  campaign_id?: string;
  account_id: string;
  contact_id: string;
  warm_path_id?: string;
  signal_id?: string;
  channel: "email" | "linkedin" | "warm_intro";
  subject?: string;
  body: string;
  intro_request?: string;
  status: MessageStatus;
  approval_status: ApprovalStatus;
  scheduled_at?: string;
  sent_at?: string;
  generated_by_ai: boolean;
  confidence_score: number;
  personalization_reason: string;
  factual_claims: string[];
  supporting_sources: string[];
  risk_flags: RiskFlag[];
  contact?: Contact;
  account?: Account;
  warm_path?: WarmPath;
  signal?: Signal;
}

export interface Approval {
  id: string;
  message_id: string;
  user_id: string;
  status: ApprovalStatus;
  edited_body?: string;
  feedback?: string;
  decided_at?: string;
}

export interface Interaction {
  id: string;
  account_id: string;
  contact_id?: string;
  type: "email_sent" | "email_replied" | "meeting" | "call" | "note" | "signal" | "warm_intro";
  summary: string;
  channel: string;
  occurred_at: string;
  metadata?: Record<string, string>;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan: Plan;
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
  current_period_end: string;
  usage_contacts: number;
  usage_messages: number;
}

export interface ICP {
  id: string;
  user_id: string;
  product_description: string;
  target_industries: string[];
  company_size: string[];
  geographies: string[];
  buyer_personas: string[];
  pain_points: string[];
  competitors: string[];
  value_props: string[];
}

export interface WritingPersona {
  id: string;
  user_id: string;
  tone: "formal" | "casual" | "direct" | "friendly" | "consultative";
  sample_phrases: string[];
  avg_sentence_length: "short" | "medium" | "long";
  style_notes: string;
  examples: string[];
}

export interface NextBestAction {
  account: string;
  account_id: string;
  contact: string;
  contact_id: string;
  reason: string;
  recommended_channel: "email" | "linkedin" | "call";
  recommended_action: string;
  confidence: number;
  urgency: "high" | "medium" | "low";
}

export interface DashboardStats {
  warm_paths_found: number;
  hot_accounts: number;
  pending_approvals: number;
  meetings_booked: number;
  pipeline_influenced: number;
  reply_rate: number;
  messages_sent: number;
}

// ─── Workspace / Tenant ────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  domain: string;
  industry: string;
  company_size: string;
  website: string;
  description: string;
  plan: Plan;
  onboarding_stage: "not_started" | "in_progress" | "complete";
  logo_url?: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "sales_rep" | "viewer";
  invited_by?: string;
  joined_at: string;
  avatar_url?: string;
  title?: string;
  connected_sources: string[];
  relationship_score: number;
}

// ─── Knowledge Base ────────────────────────────────────────────────────────

export type KBItemType =
  | "product"
  | "pricing"
  | "case_study"
  | "competitor"
  | "objection"
  | "email_example"
  | "faq"
  | "playbook"
  | "persona"
  | "compliance"
  | "value_prop"
  | "icp"
  | "custom";

export interface KnowledgeBaseItem {
  id: string;
  workspace_id: string;
  title: string;
  type: KBItemType;
  content: string;
  source?: string;
  tags: string[];
  confidence_score: number;
  approved_for_ai: boolean;
  created_at: string;
  updated_at: string;
  used_in_messages: number;
}

// ─── AI Provider / Usage ───────────────────────────────────────────────────

export type AIMode = "mock" | "local" | "remote";

export interface AIUsageLog {
  id: string;
  workspace_id: string;
  user_id: string;
  action_type:
    | "generate_message"
    | "analyze_risk"
    | "recommend_actions"
    | "summarize_icp"
    | "kb_retrieval";
  provider: "mock" | "local" | "remote";
  model: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  status: "success" | "error" | "cached";
  created_at: string;
  cache_hit?: boolean;
}

export interface WorkspaceAISettings {
  workspace_id: string;
  ai_mode: AIMode;
  monthly_budget_usd: number;
  usage_this_month_usd: number;
  allow_remote_generation: boolean;
  require_approval_for_remote: boolean;
  fallback_to_mock: boolean;
  provider: "anthropic" | "openai" | "ollama" | "mock";
  model?: string;
}

// ─── Audit Log ─────────────────────────────────────────────────────────────

export type AuditAction =
  | "message.approved"
  | "message.rejected"
  | "message.regenerated"
  | "message.generated"
  | "kb.item_added"
  | "kb.item_updated"
  | "kb.item_deleted"
  | "kb.item_approved"
  | "campaign.launched"
  | "campaign.paused"
  | "integration.connected"
  | "integration.disconnected"
  | "plan.upgraded"
  | "settings.updated"
  | "test.scenario_run"
  | "user.login"
  | "user.logout"
  | "workspace.created"
  | "onboarding.completed";

export interface AuditLog {
  id: string;
  workspace_id: string;
  actor_user_id: string;
  actor_name: string;
  action: AuditAction;
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  metadata?: Record<string, string | number | boolean>;
  created_at: string;
}

// ─── Message Risk ──────────────────────────────────────────────────────────

export interface MessageRisk {
  risk_type: string;
  severity: "low" | "medium" | "high";
  explanation: string;
  suggested_fix: string;
}

// ─── User Test Scenarios ───────────────────────────────────────────────────

export type TestScenarioStatus = "not_run" | "running" | "passed" | "failed" | "partial";

export interface UserTestStep {
  id: string;
  description: string;
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  result?: string;
  error?: string;
}

export interface UserTestScenario {
  id: string;
  name: string;
  persona: string;
  description: string;
  steps: UserTestStep[];
  status: TestScenarioStatus;
  last_run_at?: string;
  duration_ms?: number;
  issues_found: string[];
}

// ─── Omnichannel ──────────────────────────────────────────────────────────────

export type OmniChannel = "email" | "phone" | "whatsapp" | "telegram" | "linkedin" | "meta_ads";

export type IntegrationProvider =
  | "gmail"
  | "outlook"
  | "twilio"
  | "whatsapp_business"
  | "telegram_bot"
  | "linkedin"
  | "meta"
  | "hubspot"
  | "salesforce"
  | "google_calendar"
  | "resend"
  | "stripe";

export type IntegrationStatus = "connected" | "demo" | "disconnected" | "error";

export interface ChannelIntegration {
  id: string;
  workspace_id: string;
  channel: OmniChannel | "crm" | "calendar" | "billing";
  provider: IntegrationProvider;
  status: IntegrationStatus;
  display_name: string;
  description: string;
  capabilities: string[];
  connected_at?: string;
  last_sync_at?: string;
  health_score?: number;
  icon_color: string;
  demo_mode: boolean;
}

export type CampaignAssetType =
  | "email"
  | "call_script"
  | "voicemail"
  | "whatsapp_message"
  | "telegram_dm"
  | "linkedin_dm"
  | "meta_ad"
  | "landing_page_copy";

export type AssetApprovalStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "scheduled"
  | "launched";

export interface CampaignAsset {
  id: string;
  campaign_id: string;
  channel: OmniChannel;
  type: CampaignAssetType;
  title: string;
  content: string;
  subject?: string;
  headline?: string;
  status: AssetApprovalStatus;
  risk_score: number;
  confidence_score: number;
  contact_id?: string;
  account_id?: string;
  generated_by_ai: boolean;
  created_at: string;
  // Phone-specific
  call_opener?: string;
  discovery_questions?: string[];
  objection_responses?: Record<string, string>;
  voicemail_script?: string;
  // Meta-specific
  audience_description?: string;
  budget_daily?: number;
  cta?: string;
  primary_text?: string;
  simulated_results?: {
    impressions: number;
    clicks: number;
    leads: number;
    cost_per_lead: number;
  };
  // WhatsApp-specific
  template_name?: string;
  opt_out_included?: boolean;
  compliance_status?: "pending" | "approved" | "rejected";
}

export type CallOutcome =
  | "pending"
  | "connected"
  | "no_answer"
  | "voicemail_left"
  | "wrong_number"
  | "not_interested"
  | "meeting_booked"
  | "follow_up_later";

export interface CallTask {
  id: string;
  campaign_id: string;
  contact_id: string;
  account_id: string;
  script_id?: string;
  status:
    | "pending"
    | "scheduled"
    | "completed"
    | "no_answer"
    | "voicemail_left"
    | "follow_up_needed";
  scheduled_at?: string;
  completed_at?: string;
  outcome?: CallOutcome;
  outcome_notes?: string;
  duration_seconds?: number;
  follow_up_generated?: boolean;
  phone_number?: string;
}

export interface WhatsAppMessage {
  id: string;
  campaign_id: string;
  contact_id: string;
  account_id: string;
  body: string;
  template_name?: string;
  status: "draft" | "approved" | "scheduled" | "sent" | "replied" | "failed";
  opt_out_language_included: boolean;
  compliance_status: "pending" | "approved" | "rejected";
  scheduled_at?: string;
  sent_at?: string;
  replied_at?: string;
  reply_preview?: string;
}

export interface TelegramMessage {
  id: string;
  campaign_id: string;
  contact_id?: string;
  account_id?: string;
  chat_type: "direct" | "group" | "channel";
  body: string;
  status: "draft" | "approved" | "scheduled" | "sent" | "replied" | "failed";
  compliance_status: "pending" | "approved";
  scheduled_at?: string;
  sent_at?: string;
}

export type MetaObjective =
  | "lead_generation"
  | "website_traffic"
  | "retargeting"
  | "awareness"
  | "event_registration";

export interface MetaAdCampaign {
  id: string;
  workspace_id: string;
  campaign_id: string;
  objective: MetaObjective;
  audience_description: string;
  budget_daily: number;
  headline: string;
  primary_text: string;
  description?: string;
  creative_brief?: string;
  cta: string;
  landing_page_url?: string;
  status: "draft" | "pending_approval" | "launched" | "paused" | "completed";
  simulated_results?: {
    impressions: number;
    clicks: number;
    leads: number;
    ctr: number;
    cost_per_lead: number;
  };
  created_at: string;
}

export type CampaignGoal =
  | "book_meetings"
  | "revive_stalled_deals"
  | "post_demo_followup"
  | "reengage_old_leads"
  | "new_segment_launch"
  | "convert_website_visitors"
  | "win_competitor_accounts"
  | "promote_webinar"
  | "retarget_warm_accounts"
  | "expand_existing_accounts";

export type CampaignPlayType =
  | "warm_intro"
  | "founder_led_outbound"
  | "signal_based_outbound"
  | "phone_first_blitz"
  | "whatsapp_followup"
  | "telegram_community"
  | "linkedin_email_sequence"
  | "meta_retargeting"
  | "competitor_displacement"
  | "event_webinar_invite"
  | "post_demo_multistakeholder"
  | "lost_deal_revival"
  | "expansion"
  | "high_intent_website_visitor";

export interface CampaignRecommendation {
  id: string;
  workspace_id: string;
  goal: CampaignGoal;
  play_type: CampaignPlayType;
  title: string;
  reason: string;
  channels: OmniChannel[];
  target_account_ids: string[];
  estimated_impact: "high" | "medium" | "low";
  estimated_meetings: number;
  effort: "easy" | "moderate" | "hard";
  risk: "low" | "medium" | "high";
  confidence_score: number;
  time_to_launch_minutes: number;
  points_reward: number;
  created_at: string;
}

export type MissionCategory =
  | "quick_win"
  | "pipeline_builder"
  | "strategic_play"
  | "retargeting"
  | "expansion";

export interface GTMMission {
  id: string;
  workspace_id: string;
  title: string;
  description: string;
  why_it_matters: string;
  category: MissionCategory;
  impact_score: number;
  difficulty: "easy" | "moderate" | "hard";
  time_estimate_minutes: number;
  points: number;
  progress: number;
  total: number;
  status: "active" | "completed" | "dismissed";
  cta_label: string;
  cta_route: string;
  channels: OmniChannel[];
}

export type TaskType = "follow_up" | "reply_check" | "meeting_prep" | "intro_send" | "manual";
export type TaskStatus = "pending" | "completed" | "dismissed";

export interface FollowUpTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  title: string;
  description: string;
  due_date: string;
  warm_path_id?: string;
  contact_name?: string;
  account_name?: string;
  introducer_name?: string;
  created_at: string;
  completed_at?: string;
}
