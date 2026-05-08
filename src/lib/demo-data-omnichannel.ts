import type {
  CallTask,
  CampaignAsset,
  CampaignRecommendation,
  ChannelIntegration,
  GTMMission,
  MetaAdCampaign,
  TelegramMessage,
  WhatsAppMessage,
} from "@/types";

// ─── Channel Integrations ─────────────────────────────────────────────────────

export const DEMO_INTEGRATIONS: ChannelIntegration[] = [
  {
    id: "int-1",
    workspace_id: "ws-1",
    channel: "email",
    provider: "gmail",
    status: "demo",
    display_name: "Gmail",
    description: "Send personalized emails directly from your Gmail account with tracking.",
    capabilities: ["send_email", "track_opens", "track_clicks", "thread_sync"],
    icon_color: "#EA4335",
    demo_mode: true,
    health_score: 100,
    last_sync_at: "2026-05-06T08:00:00Z",
  },
  {
    id: "int-2",
    workspace_id: "ws-1",
    channel: "email",
    provider: "outlook",
    status: "disconnected",
    display_name: "Outlook / Microsoft 365",
    description: "Connect your Outlook or Microsoft 365 account for enterprise email delivery.",
    capabilities: ["send_email", "track_opens", "calendar_sync"],
    icon_color: "#0078D4",
    demo_mode: false,
  },
  {
    id: "int-3",
    workspace_id: "ws-1",
    channel: "phone",
    provider: "twilio",
    status: "demo",
    display_name: "Twilio Voice",
    description: "Outbound calling with AI-generated scripts, call recording, and outcome logging.",
    capabilities: ["outbound_calls", "call_recording", "voicemail_drop", "call_transcription"],
    icon_color: "#F22F46",
    demo_mode: true,
    health_score: 95,
  },
  {
    id: "int-4",
    workspace_id: "ws-1",
    channel: "whatsapp",
    provider: "whatsapp_business",
    status: "demo",
    display_name: "WhatsApp Business",
    description: "Send template-approved WhatsApp messages for high-intent follow-ups.",
    capabilities: ["template_messages", "opt_out_management", "reply_tracking"],
    icon_color: "#25D366",
    demo_mode: true,
    health_score: 88,
  },
  {
    id: "int-5",
    workspace_id: "ws-1",
    channel: "telegram",
    provider: "telegram_bot",
    status: "demo",
    display_name: "Telegram Bot",
    description: "Reach prospects via Telegram DMs and community group announcements.",
    capabilities: ["direct_message", "group_post", "channel_announcement"],
    icon_color: "#26A5E4",
    demo_mode: true,
    health_score: 92,
  },
  {
    id: "int-6",
    workspace_id: "ws-1",
    channel: "linkedin",
    provider: "linkedin",
    status: "demo",
    display_name: "LinkedIn",
    description: "Send LinkedIn connection requests and DMs with AI-crafted messages.",
    capabilities: ["connection_request", "direct_message", "inmail"],
    icon_color: "#0A66C2",
    demo_mode: true,
    health_score: 79,
  },
  {
    id: "int-7",
    workspace_id: "ws-1",
    channel: "meta_ads",
    provider: "meta",
    status: "demo",
    display_name: "Meta Ads",
    description:
      "Run retargeting and lead gen campaigns on Facebook & Instagram for warm accounts.",
    capabilities: ["lead_generation", "retargeting", "lookalike_audiences", "creative_testing"],
    icon_color: "#0866FF",
    demo_mode: true,
    health_score: 85,
  },
  {
    id: "int-8",
    workspace_id: "ws-1",
    channel: "crm",
    provider: "hubspot",
    status: "demo",
    display_name: "HubSpot CRM",
    description: "Sync contacts, deals, and activity logs with HubSpot.",
    capabilities: ["contact_sync", "deal_sync", "activity_logging", "sequence_enrollment"],
    icon_color: "#FF7A59",
    demo_mode: true,
    health_score: 97,
    last_sync_at: "2026-05-06T07:30:00Z",
  },
  {
    id: "int-9",
    workspace_id: "ws-1",
    channel: "crm",
    provider: "salesforce",
    status: "disconnected",
    display_name: "Salesforce",
    description: "Enterprise CRM sync contacts, opportunities, and campaign attribution.",
    capabilities: ["contact_sync", "opportunity_sync", "campaign_attribution"],
    icon_color: "#00A1E0",
    demo_mode: false,
  },
  {
    id: "int-10",
    workspace_id: "ws-1",
    channel: "calendar",
    provider: "google_calendar",
    status: "demo",
    display_name: "Google Calendar",
    description: "Auto-create meeting invites when prospects reply and book time.",
    capabilities: ["meeting_scheduling", "availability_sync", "reminder_creation"],
    icon_color: "#4285F4",
    demo_mode: true,
    health_score: 100,
  },
  {
    id: "int-11",
    workspace_id: "ws-1",
    channel: "email",
    provider: "resend",
    status: "disconnected",
    display_name: "Resend",
    description: "Transactional email delivery with high deliverability and tracking.",
    capabilities: ["transactional_email", "deliverability_monitoring", "open_tracking"],
    icon_color: "#000000",
    demo_mode: false,
  },
  {
    id: "int-12",
    workspace_id: "ws-1",
    channel: "billing",
    provider: "stripe",
    status: "disconnected",
    display_name: "Stripe",
    description: "Billing, usage-based pricing, and subscription management.",
    capabilities: ["subscription_management", "usage_billing", "invoice_generation"],
    icon_color: "#6772E5",
    demo_mode: false,
  },
];

// ─── Campaign Assets (Omnichannel) ────────────────────────────────────────────

export const DEMO_CAMPAIGN_ASSETS: CampaignAsset[] = [
  // Email asset
  {
    id: "asset-1",
    campaign_id: "camp-1",
    channel: "email",
    type: "email",
    title: "Warm intro email Acme AI (Priya Sharma)",
    content: `Hi Priya,

Sarah mentioned you're close to Acme's outbound hiring push I saw you're adding 3 SDRs this quarter.

Most teams at your stage try to solve it with more headcount. We took a different angle: WarmPath routes every outreach through your team's warmest relationship path, so your SDRs are closing intro-ed conversations, not cold calls.

SeriesAI went from 7% to 38% reply rate in 6 weeks. Happy to show you the graph of exactly how we'd map Acme's network.

Worth 15 minutes Thursday or Friday?

Adhik`,
    subject: "Acme's SDR push warm outbound angle",
    status: "pending_approval",
    risk_score: 12,
    confidence_score: 0.91,
    contact_id: "contact-1",
    account_id: "acc-1",
    generated_by_ai: true,
    created_at: "2026-05-06T07:00:00Z",
  },
  // Call script asset
  {
    id: "asset-2",
    campaign_id: "camp-1",
    channel: "phone",
    type: "call_script",
    title: "Phone script Acme AI (Priya Sharma)",
    content: `OPENER:
"Hey Priya, this is Adhik from WarmPath. Quick reason for the call we noticed Acme is hiring SDRs and Sarah Chen mentioned you're close to the outbound planning. I had a short idea on using warm-path selling instead of adding more cold volume. Got 2 minutes?"

IF YES:
"Great. So most teams at your stage hire more SDRs and blast cold email and reply rates drop to 3-5%. We flip that. WarmPath maps your team's actual relationships and routes every message through the warmest path. Think of it like LinkedIn connections, but automated and grounded in your email history.

SeriesAI went from 7% to 38% reply rate in their first month. For Acme specifically, I can see 4 warm paths to your target accounts already.

Would a 20-minute Zoom make sense this week to show you the map?"

DISCOVERY QUESTIONS:
- How many outbound touches does your team do per week right now?
- What's your current reply rate on cold outbound?
- Do you have a warm relationship layer or is it all cold?
- What's the biggest friction in your current SDR motion?

OBJECTION: "We already use Apollo/Outreach"
"Totally WarmPath isn't replacing your sequence tool. It's the warm-path layer on top. Apollo tells you who to target; WarmPath tells you who on your team already knows them and drafts the intro request. Those are different problems."

VOICEMAIL:
"Hey Priya, Adhik from WarmPath. Quick one saw Acme is hiring SDRs and we just mapped 4 warm paths into your target accounts that you probably don't know exist. Would love to show you a 5-minute demo. I'll send you a note feel free to grab time on my calendar. Talk soon."`,
    call_opener: "Hey Priya, this is Adhik from WarmPath. Quick reason for the call...",
    discovery_questions: [
      "How many outbound touches does your team do per week right now?",
      "What's your current reply rate on cold outbound?",
      "Do you have a warm relationship layer or is it all cold?",
    ],
    objection_responses: {
      "We already use Apollo":
        "WarmPath isn't replacing your sequence tool it's the warm-path layer on top.",
      "Not interested":
        "Totally fair. Can I ask what your current reply rate looks like? If it's above 15%, you don't need us.",
      "Send me an email":
        "Sure what's the best address? And is there a better time for a quick call this week?",
    },
    voicemail_script: "Hey Priya, Adhik from WarmPath. Quick one saw Acme is hiring SDRs...",
    status: "pending_approval",
    risk_score: 5,
    confidence_score: 0.87,
    contact_id: "contact-1",
    account_id: "acc-1",
    generated_by_ai: true,
    created_at: "2026-05-06T07:05:00Z",
  },
  // WhatsApp message
  {
    id: "asset-3",
    campaign_id: "camp-1",
    channel: "whatsapp",
    type: "whatsapp_message",
    title: "WhatsApp follow-up Priya Sharma",
    content:
      "Hey Priya Adhik here. Sarah mentioned you're close to Acme's outbound hiring push. Saw you're adding SDRs, so thought this might be useful. We mapped 4 warm paths into your target accounts worth a quick look? (Reply STOP to opt out)",
    template_name: "warm_followup_v1",
    status: "pending_approval",
    risk_score: 8,
    confidence_score: 0.89,
    contact_id: "contact-1",
    account_id: "acc-1",
    opt_out_included: true,
    compliance_status: "pending",
    generated_by_ai: true,
    created_at: "2026-05-06T07:10:00Z",
  },
  // LinkedIn DM
  {
    id: "asset-4",
    campaign_id: "camp-1",
    channel: "linkedin",
    type: "linkedin_dm",
    title: "LinkedIn DM Priya Sharma",
    content:
      "Hey Priya noticed Acme is scaling the GTM team. We help Series B teams like yours turn cold outbound into warm-path selling. Sarah Chen thought we might be a good fit. Happy to send a quick breakdown?",
    status: "approved",
    risk_score: 3,
    confidence_score: 0.92,
    contact_id: "contact-1",
    account_id: "acc-1",
    generated_by_ai: true,
    created_at: "2026-05-06T07:15:00Z",
  },
  // Meta Ad
  {
    id: "asset-5",
    campaign_id: "camp-2",
    channel: "meta_ads",
    type: "meta_ad",
    title: "Meta retargeting ad Fintech CFOs",
    headline: "Still relying on cold outbound?",
    content:
      "WarmPath helps GTM teams find warm paths into high-intent accounts and launch human-approved outreach across email, phone, WhatsApp, and ads. 5× higher reply rates.",
    primary_text:
      "Most B2B teams send 200 cold emails to book 1 meeting. WarmPath teams send 40 warm-path messages and book 8. The difference is relationship routing.",
    status: "pending_approval",
    risk_score: 2,
    confidence_score: 0.94,
    account_id: "acc-2",
    generated_by_ai: true,
    audience_description:
      "Fintech CFOs and VPs of Finance at Series B-C companies, 200-1000 employees, who have visited pricing pages or competitor pages in the last 30 days.",
    budget_daily: 50,
    cta: "See Warm Paths",
    simulated_results: {
      impressions: 45000,
      clicks: 1350,
      leads: 27,
      cost_per_lead: 55,
    },
    created_at: "2026-05-06T07:20:00Z",
  },
  // Telegram DM
  {
    id: "asset-6",
    campaign_id: "camp-3",
    channel: "telegram",
    type: "telegram_dm",
    title: "Telegram DM Dev-focused outreach",
    content:
      "Hey! Noticed you're building in the B2B SaaS space. We just launched WarmPath it maps your team's actual network and routes outbound through warm intros automatically. Would love your honest feedback as an early user. Happy to give you free access for 3 months.",
    status: "draft",
    risk_score: 4,
    confidence_score: 0.82,
    generated_by_ai: true,
    created_at: "2026-05-06T07:25:00Z",
  },
  // Voicemail
  {
    id: "asset-7",
    campaign_id: "camp-1",
    channel: "phone",
    type: "voicemail",
    title: "Voicemail drop Aarav Singh",
    content:
      "Hey Aarav, Adhik from WarmPath. Saw TechFlow just closed Series A congrats! Quick thought on warm outbound for your new GTM push. I'll shoot you a note but feel free to grab 15 minutes on my calendar link in the email. Cheers.",
    status: "approved",
    risk_score: 2,
    confidence_score: 0.88,
    contact_id: "contact-3",
    account_id: "acc-3",
    generated_by_ai: true,
    created_at: "2026-05-05T14:00:00Z",
  },
];

// ─── Call Tasks ────────────────────────────────────────────────────────────────

export const DEMO_CALL_TASKS: CallTask[] = [
  {
    id: "call-1",
    campaign_id: "camp-1",
    contact_id: "contact-1",
    account_id: "acc-1",
    script_id: "asset-2",
    status: "pending",
    scheduled_at: "2026-05-07T10:00:00Z",
    phone_number: "+1 (415) 555-0142",
  },
  {
    id: "call-2",
    campaign_id: "camp-1",
    contact_id: "contact-3",
    account_id: "acc-3",
    script_id: "asset-2",
    status: "voicemail_left",
    completed_at: "2026-05-05T14:30:00Z",
    outcome: "voicemail_left",
    duration_seconds: 28,
    follow_up_generated: true,
    phone_number: "+1 (650) 555-0187",
  },
  {
    id: "call-3",
    campaign_id: "camp-4",
    contact_id: "contact-5",
    account_id: "acc-5",
    status: "scheduled",
    scheduled_at: "2026-05-08T15:00:00Z",
    phone_number: "+1 (212) 555-0219",
  },
];

// ─── WhatsApp Messages ────────────────────────────────────────────────────────

export const DEMO_WHATSAPP_MESSAGES: WhatsAppMessage[] = [
  {
    id: "wa-1",
    campaign_id: "camp-1",
    contact_id: "contact-1",
    account_id: "acc-1",
    body: "Hey Priya Adhik here. Sarah mentioned you're close to Acme's outbound hiring push. Saw you're adding SDRs, so thought this might be useful. We mapped 4 warm paths into your target accounts worth a quick look? (Reply STOP to opt out)",
    template_name: "warm_followup_v1",
    status: "approved",
    opt_out_language_included: true,
    compliance_status: "approved",
    scheduled_at: "2026-05-08T09:00:00Z",
  },
  {
    id: "wa-2",
    campaign_id: "camp-2",
    contact_id: "contact-7",
    account_id: "acc-7",
    body: "Hey Meera! Quick follow-up on our demo last week. Saw FinCore just posted 3 SDR roles we can map warm paths for all your target fintech accounts. Happy to show you updated results? (Reply STOP to opt out)",
    template_name: "demo_followup_v2",
    status: "draft",
    opt_out_language_included: true,
    compliance_status: "pending",
  },
];

// ─── Telegram Messages ────────────────────────────────────────────────────────

export const DEMO_TELEGRAM_MESSAGES: TelegramMessage[] = [
  {
    id: "tg-1",
    campaign_id: "camp-3",
    chat_type: "direct",
    body: "Hey! Noticed you're building in the B2B SaaS space. We just launched WarmPath maps your team's network and routes outbound through warm intros automatically. Would love your honest feedback. Happy to give free access for 3 months.",
    status: "draft",
    compliance_status: "pending",
  },
];

// ─── Meta Ad Campaigns ────────────────────────────────────────────────────────

export const DEMO_META_CAMPAIGNS: MetaAdCampaign[] = [
  {
    id: "meta-1",
    workspace_id: "ws-1",
    campaign_id: "camp-2",
    objective: "retargeting",
    audience_description:
      "Fintech CFOs and VPs of Finance at Series B-C companies, 200-1000 employees, who visited pricing or competitor pages in the last 30 days.",
    budget_daily: 50,
    headline: "Still relying on cold outbound?",
    primary_text:
      "Most B2B teams send 200 cold emails to book 1 meeting. WarmPath teams send 40 warm-path messages and book 8. The difference is relationship routing automated.",
    description: "Warm-path GTM for high-intent fintech accounts.",
    creative_brief:
      "Show a split: cold email with 3% reply rate vs. warm path with 38% reply rate. Clean, data-forward visual.",
    cta: "See Warm Paths",
    status: "pending_approval",
    simulated_results: {
      impressions: 45000,
      clicks: 1350,
      leads: 27,
      ctr: 3.0,
      cost_per_lead: 55,
    },
    created_at: "2026-05-06T07:20:00Z",
  },
  {
    id: "meta-2",
    workspace_id: "ws-1",
    campaign_id: "camp-5",
    objective: "lead_generation",
    audience_description:
      "VP Sales, Head of Revenue, Founder/CEO at SaaS companies, 50-500 employees, Series A-C, interested in sales tools, CRM, outbound.",
    budget_daily: 75,
    headline: "Book 5× more meetings same team",
    primary_text:
      "WarmPath finds who at your company already knows your target buyer then builds the warm intro campaign automatically. No new headcount.",
    cta: "Start Free Trial",
    status: "launched",
    simulated_results: {
      impressions: 128000,
      clicks: 3840,
      leads: 92,
      ctr: 3.0,
      cost_per_lead: 41,
    },
    created_at: "2026-04-20T10:00:00Z",
  },
];

// ─── Campaign Recommendations ─────────────────────────────────────────────────

export const DEMO_CAMPAIGN_RECOMMENDATIONS: CampaignRecommendation[] = [
  {
    id: "rec-1",
    workspace_id: "ws-1",
    goal: "book_meetings",
    play_type: "phone_first_blitz",
    title: "Phone-First Blitz High-Intent Fintech",
    reason:
      "6 fintech accounts show fresh hiring signals + verified phone numbers. 4 have warm paths. Phone converts 3× better than email for this segment.",
    channels: ["phone", "email", "whatsapp"],
    target_account_ids: ["acc-1", "acc-2", "acc-7", "acc-8", "acc-9", "acc-10"],
    estimated_impact: "high",
    estimated_meetings: 8,
    effort: "moderate",
    risk: "low",
    confidence_score: 0.87,
    time_to_launch_minutes: 12,
    points_reward: 150,
    created_at: "2026-05-06T06:00:00Z",
  },
  {
    id: "rec-2",
    workspace_id: "ws-1",
    goal: "revive_stalled_deals",
    play_type: "whatsapp_followup",
    title: "WhatsApp Re-engagement Demo No-Shows",
    reason:
      "3 accounts went dark after the demo. WhatsApp follow-up has 65% open rate vs 22% email. Timing: 7 days post-demo is optimal.",
    channels: ["whatsapp", "email"],
    target_account_ids: ["acc-3", "acc-6", "acc-11"],
    estimated_impact: "high",
    estimated_meetings: 3,
    effort: "easy",
    risk: "low",
    confidence_score: 0.91,
    time_to_launch_minutes: 7,
    points_reward: 100,
    created_at: "2026-05-06T06:05:00Z",
  },
  {
    id: "rec-3",
    workspace_id: "ws-1",
    goal: "convert_website_visitors",
    play_type: "meta_retargeting",
    title: "Meta Retargeting Pricing Page Visitors",
    reason:
      "12 companies hit the pricing page this week. Meta retargeting reaches decision-makers outside working hours with 3% avg CTR for this ICP.",
    channels: ["meta_ads", "email"],
    target_account_ids: ["acc-4", "acc-12", "acc-13"],
    estimated_impact: "medium",
    estimated_meetings: 5,
    effort: "easy",
    risk: "low",
    confidence_score: 0.83,
    time_to_launch_minutes: 15,
    points_reward: 80,
    created_at: "2026-05-06T06:10:00Z",
  },
  {
    id: "rec-4",
    workspace_id: "ws-1",
    goal: "win_competitor_accounts",
    play_type: "competitor_displacement",
    title: "Competitor Displacement Apollo Users",
    reason:
      "4 accounts just posted roles that mention Apollo in requirements. Competitor displacement plays with warm intro have 2× close rate.",
    channels: ["email", "linkedin", "phone"],
    target_account_ids: ["acc-5", "acc-14", "acc-15", "acc-16"],
    estimated_impact: "high",
    estimated_meetings: 4,
    effort: "hard",
    risk: "medium",
    confidence_score: 0.76,
    time_to_launch_minutes: 20,
    points_reward: 200,
    created_at: "2026-05-06T06:15:00Z",
  },
  {
    id: "rec-5",
    workspace_id: "ws-1",
    goal: "promote_webinar",
    play_type: "event_webinar_invite",
    title: "Webinar Invite 'Warm Outbound Masterclass'",
    reason:
      "Warm-touch webinar invite converts 4× better than direct sales ask. 18 accounts in nurture stage are ideal for this.",
    channels: ["email", "linkedin", "telegram"],
    target_account_ids: [],
    estimated_impact: "medium",
    estimated_meetings: 6,
    effort: "easy",
    risk: "low",
    confidence_score: 0.88,
    time_to_launch_minutes: 8,
    points_reward: 90,
    created_at: "2026-05-06T06:20:00Z",
  },
];

// ─── GTM Missions ─────────────────────────────────────────────────────────────

export const DEMO_GTM_MISSIONS: GTMMission[] = [
  {
    id: "mission-1",
    workspace_id: "ws-1",
    title: "Launch warm intro blitz for 5 fintech accounts",
    description:
      "3 accounts have fresh hiring signals + warm paths. Start the sequence before competitors do.",
    why_it_matters:
      "These accounts show the strongest buying intent this week. First-mover gets 3× higher reply rate.",
    category: "quick_win",
    impact_score: 92,
    difficulty: "easy",
    time_estimate_minutes: 8,
    points: 150,
    progress: 0,
    total: 5,
    status: "active",
    cta_label: "Build campaign",
    cta_route: "/campaigns/new",
    channels: ["email", "phone"],
  },
  {
    id: "mission-2",
    workspace_id: "ws-1",
    title: "Approve 3 pending WhatsApp follow-ups",
    description:
      "Messages are ready for demo no-shows from last week. WhatsApp has 65% open rate vs 22% email.",
    why_it_matters: "Demo no-shows re-engage at 40% if contacted within 7 days. Day 6 today.",
    category: "pipeline_builder",
    impact_score: 85,
    difficulty: "easy",
    time_estimate_minutes: 3,
    points: 60,
    progress: 0,
    total: 3,
    status: "active",
    cta_label: "Review queue",
    cta_route: "/approval-queue",
    channels: ["whatsapp"],
  },
  {
    id: "mission-3",
    workspace_id: "ws-1",
    title: "Launch Meta retargeting for pricing page visitors",
    description:
      "12 companies hit your pricing page this week. Retargeting them now while intent is hot.",
    why_it_matters:
      "Retargeting intent-hot accounts in the first 48h has 2× CTR vs delayed campaigns.",
    category: "retargeting",
    impact_score: 78,
    difficulty: "easy",
    time_estimate_minutes: 15,
    points: 80,
    progress: 0,
    total: 1,
    status: "active",
    cta_label: "Create Meta campaign",
    cta_route: "/campaigns/new",
    channels: ["meta_ads"],
  },
  {
    id: "mission-4",
    workspace_id: "ws-1",
    title: "Add competitor battlecard to KB",
    description:
      "The Apollo battlecard is missing pricing objection responses. AI is using generic fallback.",
    why_it_matters:
      "Without it, 40% of generated messages miss the competitor angle. Adds ~12% to reply rate.",
    category: "pipeline_builder",
    impact_score: 71,
    difficulty: "easy",
    time_estimate_minutes: 10,
    points: 50,
    progress: 0,
    total: 1,
    status: "active",
    cta_label: "Update KB",
    cta_route: "/knowledge-base",
    channels: ["email"],
  },
  {
    id: "mission-5",
    workspace_id: "ws-1",
    title: "Call 2 high-intent accounts phone script ready",
    description:
      "Acme AI and TechFlow have verified numbers and call scripts approved. Best window: 10-11am.",
    why_it_matters: "Phone-first for accounts with warm paths has 3× meeting rate vs email alone.",
    category: "strategic_play",
    impact_score: 88,
    difficulty: "moderate",
    time_estimate_minutes: 25,
    points: 120,
    progress: 0,
    total: 2,
    status: "active",
    cta_label: "View call queue",
    cta_route: "/approval-queue",
    channels: ["phone"],
  },
];

// ─── Channel color map ─────────────────────────────────────────────────────────

export const CHANNEL_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon_color: string;
  }
> = {
  email: {
    label: "Email",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon_color: "#3B82F6",
  },
  phone: {
    label: "Phone",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon_color: "#10B981",
  },
  whatsapp: {
    label: "WhatsApp",
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    icon_color: "#25D366",
  },
  telegram: {
    label: "Telegram",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    icon_color: "#26A5E4",
  },
  linkedin: {
    label: "LinkedIn",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    icon_color: "#0A66C2",
  },
  meta_ads: {
    label: "Meta Ads",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    icon_color: "#0866FF",
  },
};

// ─── Campaign play type metadata ──────────────────────────────────────────────

export const CAMPAIGN_PLAY_TYPES = [
  {
    id: "warm_intro",
    title: "Warm Intro Campaign",
    description:
      "Route outreach through your team's warmest relationship paths. Best for high-value accounts.",
    best_for: "Enterprise, strategic accounts",
    channels: ["email", "linkedin"] as const,
    effort: "moderate" as const,
    impact: "high" as const,
    risk: "low" as const,
    icon: "🤝",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "phone_first_blitz",
    title: "Phone-First Blitz",
    description:
      "Lead with personalized calls using AI-generated scripts. Follow up via email and WhatsApp.",
    best_for: "High-intent signals, urgent pipeline",
    channels: ["phone", "email", "whatsapp"] as const,
    effort: "hard" as const,
    impact: "high" as const,
    risk: "low" as const,
    icon: "📞",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    id: "whatsapp_followup",
    title: "WhatsApp Follow-Up",
    description: "Re-engage demo no-shows and stalled deals via WhatsApp with compliant templates.",
    best_for: "Demo no-shows, 7-14 day follow-up",
    channels: ["whatsapp", "email"] as const,
    effort: "easy" as const,
    impact: "high" as const,
    risk: "low" as const,
    icon: "💬",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    id: "meta_retargeting",
    title: "Meta Retargeting",
    description:
      "Reach decision-makers on Facebook & Instagram who visited your pricing or competitor pages.",
    best_for: "Website visitors, intent signals",
    channels: ["meta_ads", "email"] as const,
    effort: "easy" as const,
    impact: "medium" as const,
    risk: "low" as const,
    icon: "📣",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    id: "signal_based_outbound",
    title: "Signal-Based Outbound",
    description:
      "Trigger personalized outreach the moment a buying signal fires funding, hiring, leadership change.",
    best_for: "Fresh signals, competitive timing",
    channels: ["email", "linkedin", "phone"] as const,
    effort: "moderate" as const,
    impact: "high" as const,
    risk: "low" as const,
    icon: "⚡",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "competitor_displacement",
    title: "Competitor Displacement",
    description:
      "Target accounts showing competitor intent job postings mentioning Apollo, Outreach, Clay.",
    best_for: "Competitor accounts, displacement plays",
    channels: ["email", "linkedin", "phone"] as const,
    effort: "hard" as const,
    impact: "high" as const,
    risk: "medium" as const,
    icon: "🎯",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    id: "linkedin_email_sequence",
    title: "LinkedIn + Email Sequence",
    description:
      "Multi-touch sequence starting with LinkedIn connection, followed by email cadence.",
    best_for: "SMB, SDR-led motion",
    channels: ["linkedin", "email"] as const,
    effort: "moderate" as const,
    impact: "medium" as const,
    risk: "low" as const,
    icon: "🔗",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    id: "telegram_community",
    title: "Telegram Community",
    description: "Reach developer and founder communities via Telegram groups and direct messages.",
    best_for: "Dev-focused, founder communities",
    channels: ["telegram", "email"] as const,
    effort: "moderate" as const,
    impact: "medium" as const,
    risk: "low" as const,
    icon: "✈️",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  {
    id: "lost_deal_revival",
    title: "Lost Deal Revival",
    description:
      "Re-engage closed-lost accounts with new signal hooks leadership change, funding, new pain.",
    best_for: "Lost deals 90-180 days old",
    channels: ["email", "phone", "whatsapp"] as const,
    effort: "moderate" as const,
    impact: "high" as const,
    risk: "low" as const,
    icon: "🔄",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    id: "event_webinar_invite",
    title: "Webinar / Event Invite",
    description:
      "Invite warm-path accounts to a webinar, roundtable, or live event. Soft touch, high value.",
    best_for: "Mid-funnel nurture, authority building",
    channels: ["email", "linkedin", "telegram"] as const,
    effort: "easy" as const,
    impact: "medium" as const,
    risk: "low" as const,
    icon: "🎪",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
];

export const CAMPAIGN_GOALS = [
  {
    id: "book_meetings",
    label: "Book meetings",
    icon: "📅",
    description: "Drive calendar bookings with high-intent accounts",
  },
  {
    id: "revive_stalled_deals",
    label: "Revive stalled deals",
    icon: "🔄",
    description: "Re-engage accounts that went quiet",
  },
  {
    id: "post_demo_followup",
    label: "Follow up after demo",
    icon: "✅",
    description: "Move demo attendees to next stage",
  },
  {
    id: "reengage_old_leads",
    label: "Re-engage old leads",
    icon: "💤",
    description: "Wake up leads dormant 90+ days",
  },
  {
    id: "new_segment_launch",
    label: "Launch into new segment",
    icon: "🚀",
    description: "Enter a new vertical or persona",
  },
  {
    id: "convert_website_visitors",
    label: "Convert website visitors",
    icon: "🌐",
    description: "Convert pricing page + intent signals",
  },
  {
    id: "win_competitor_accounts",
    label: "Win competitor accounts",
    icon: "🎯",
    description: "Displace Apollo, Outreach, Clay users",
  },
  {
    id: "promote_webinar",
    label: "Promote webinar / event",
    icon: "🎪",
    description: "Drive registrations for an upcoming event",
  },
  {
    id: "retarget_warm_accounts",
    label: "Retarget warm accounts",
    icon: "🎣",
    description: "Multi-channel retargeting for interested accounts",
  },
  {
    id: "expand_existing_accounts",
    label: "Expand existing accounts",
    icon: "📈",
    description: "Upsell or cross-sell existing customers",
  },
];
