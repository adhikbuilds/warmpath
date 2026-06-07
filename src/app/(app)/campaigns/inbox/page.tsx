"use client";

import {
  Bot,
  ChevronRight,
  Circle,
  Inbox,
  MoreHorizontal,
  Reply,
  Search,
  Send,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { useSalesStore } from "@/stores/salesStore";

const FILTERS = [
  { key: "all", label: "All Inboxes", icon: Inbox },
  { key: "unread", label: "Unread", icon: Circle, count: 4 },
  { key: "starred", label: "Starred", icon: Star, count: 2 },
  { key: "sent", label: "Sent", icon: Send },
  { key: "pending", label: "Pending Reply", icon: Reply, count: 3 },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

// Demo email thread data
const DEMO_THREADS = [
  {
    id: "t-1",
    from: "Tapan Pattanayak",
    initials: "TP",
    email: "tapan@somecompany.com",
    company: "TechCorp",
    campaign: "SAP Event Users New- 03-06-2026",
    subject: "Re: SAP Now AI Tour Mumbai invite",
    preview: "Hi! Let me know and I'd be happy to connect — sounds interesting…",
    time: "Jun 6, 2:54 PM",
    isRead: false,
    isStarred: false,
    tag: "Converted",
    thread: [
      {
        id: "tm-1",
        from: "Adhik Agarwal",
        email: "adhik@seedlinglabs.com",
        time: "Jun 6, 8:03 PM GMT+5:30",
        body: `Hi Tapan,

I'm Adhik, an active founder building SAP AI agents at Siosté. I'm speaking at SAP Now AI Tour Mumbai next week where we/others are on a platform sponsor. For leaders who stop by our booth, we'll run an analysis on a slice of your own SAP data and share back what we first benchmarked against everything (we've mappings have mapped).

Running a million-plus lines of custom ABAP across industries gave us insight into where/what industries give us insight into where [I'm happy to share/each I'm happy to share to where/each I'm happy to share].

Would it be great to catch up there? Would it make sense to catch up there? Is anything up there/to catching up there?`,
      },
      {
        id: "tm-2",
        from: "Tapan Pattanayak",
        email: "tapan@somecompany.com",
        time: "Jun 8, 2026, 2:30 PM GMT+5:30",
        body: `Hi Adhik,

Re: SAP Now AI Tour Mumbai invite.

Hi Tapan, it will certainly be a pleasure to be at the event!`,
      },
    ],
  },
  {
    id: "t-2",
    from: "Bhavesh Narendranath",
    initials: "BN",
    email: "bhavesh@techsolutions.in",
    company: "Tech Solutions",
    campaign: "SAP Event Users New- 03-06-2026",
    subject: "SAP Now AI Tour Mumbai invite",
    preview: "Thanks for reaching out! I'd love to hear more about the SAP analysis…",
    time: "Jun 6, 11:24 AM",
    isRead: true,
    isStarred: true,
    tag: null,
    thread: [
      {
        id: "tm-3",
        from: "Adhik Agarwal",
        email: "adhik@seedlinglabs.com",
        time: "Jun 5, 9:00 AM GMT+5:30",
        body: `Hi Bhavesh,

I'm speaking at SAP Now AI Tour Mumbai next week and thought it'd be great to connect. We build AI agents for SAP environments and would love to show you what we're working on.

Would you be free to stop by our booth?`,
      },
      {
        id: "tm-4",
        from: "Bhavesh Narendranath",
        email: "bhavesh@techsolutions.in",
        time: "Jun 6, 11:24 AM GMT+5:30",
        body: `Hi Adhik,

Thanks for reaching out! I'd love to hear more about the SAP analysis. I'll definitely stop by the booth.

Looking forward to it!`,
      },
    ],
  },
  {
    id: "t-3",
    from: "Ananya Krishnan",
    initials: "AK",
    email: "ananya.k@infosys.com",
    company: "Infosys",
    campaign: "Series A GTM Scaling",
    subject: "Re: Warm outbound at scale — for Infosys",
    preview: "Interesting approach. Can you send over more details about the platform?",
    time: "Jun 5, 3:12 PM",
    isRead: true,
    isStarred: false,
    tag: "Positive",
    thread: [
      {
        id: "tm-5",
        from: "Adhik Agarwal",
        email: "adhik@seedlinglabs.com",
        time: "Jun 4, 10:00 AM GMT+5:30",
        body: `Hi Ananya,

Rohan mentioned you two crossed paths at the AWS Summit — he had great things to say.

We help B2B teams turn cold outbound into warm intros by mapping your team's existing relationships. Most teams see 3–4x higher reply rates vs cold email.

Would a 20-min call make sense this week?`,
      },
      {
        id: "tm-6",
        from: "Ananya Krishnan",
        email: "ananya.k@infosys.com",
        time: "Jun 5, 3:12 PM GMT+5:30",
        body: `Hi Adhik,

Interesting approach. Can you send over more details about the platform? Particularly how the relationship mapping works and what integrations you support.

Thanks!`,
      },
    ],
  },
  {
    id: "t-4",
    from: "Rohan Mehta",
    initials: "RM",
    email: "rohan.mehta@startup.io",
    company: "Startup.io",
    campaign: "Hiring Signal SDR & RevOps",
    subject: "Re: Your RevOps hire — perfect timing",
    preview: "We just posted the role yesterday, so your timing is spot on!",
    time: "Jun 4, 6:45 PM",
    isRead: false,
    isStarred: false,
    tag: null,
    thread: [
      {
        id: "tm-7",
        from: "Adhik Agarwal",
        email: "adhik@seedlinglabs.com",
        time: "Jun 4, 2:00 PM GMT+5:30",
        body: `Hi Rohan,

Noticed Startup.io just posted a RevOps Manager role on LinkedIn — perfect timing to chat.

We help RevOps teams instrument their outbound motion from day one. Quick 15 min call?`,
      },
      {
        id: "tm-8",
        from: "Rohan Mehta",
        email: "rohan.mehta@startup.io",
        time: "Jun 4, 6:45 PM GMT+5:30",
        body: `Hi Adhik,

We just posted the role yesterday, so your timing is spot on! Let's schedule a call. I'm free Thursday or Friday afternoon.`,
      },
    ],
  },
  {
    id: "t-5",
    from: "Sneha Gupta",
    initials: "SG",
    email: "sneha.g@enterprise.com",
    company: "Enterprise Co",
    campaign: "Series A GTM Scaling",
    subject: "Re: WarmPath intro",
    preview: "I've forwarded your message to our VP of Sales who handles vendor evals.",
    time: "Jun 3, 10:22 AM",
    isRead: true,
    isStarred: true,
    tag: null,
    thread: [
      {
        id: "tm-9",
        from: "Sneha Gupta",
        email: "sneha.g@enterprise.com",
        time: "Jun 3, 10:22 AM GMT+5:30",
        body: "Hi Adhik, I've forwarded your message to our VP of Sales who handles vendor evaluations. You should hear from him by end of week.",
      },
    ],
  },
];

const DEMO_EMAIL = "demo@warmpath.ai";

export default function MasterInboxPage() {
  const { user } = useAuthStore();
  const isDemo = user?.email === DEMO_EMAIL;
  const selfName = user?.name ?? "You";
  const selfEmail = user?.email ?? "";

  // Remap demo threads: replace hardcoded sender with real user's identity
  const threads = isDemo
    ? DEMO_THREADS.map((t) => ({
        ...t,
        thread: t.thread.map((msg) =>
          msg.from === "Adhik Agarwal"
            ? { ...msg, from: selfName, email: selfEmail }
            : msg,
        ),
      }))
    : [];

  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [selectedThreadId, setSelectedThreadId] = useState<string>(DEMO_THREADS[0].id);
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  const visibleThreads = threads.filter((t) => {
    if (
      search &&
      !t.from.toLowerCase().includes(search.toLowerCase()) &&
      !t.subject.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (activeFilter === "unread") return !t.isRead;
    if (activeFilter === "starred") return t.isStarred;
    if (activeFilter === "pending") return !t.isRead || t.tag === null;
    return true;
  });

  if (!isDemo && threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <Inbox className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">No replies yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Once your campaigns send emails and prospects reply, conversations will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left filter sidebar */}
      <div className="w-[180px] shrink-0 border-r border-border/60 bg-card/20 flex flex-col py-3 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 mb-2">
          Inbox
        </p>
        <nav className="space-y-0.5 px-2">
          {FILTERS.map(({ key, label, icon: Icon, ...rest }) => {
            const count = "count" in rest ? rest.count : undefined;
            const active = activeFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] font-medium transition-colors ${
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {count !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground"}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-4 px-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Labels
          </p>
          <div className="space-y-0.5">
            {["Converted", "Positive", "Interested", "Not Now", "Unsubscribed"].map((lbl) => (
              <button
                key={lbl}
                type="button"
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Tag className="w-3 h-3 shrink-0" />
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Email list */}
      <div className="w-[280px] shrink-0 border-r border-border/60 flex flex-col overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border/40 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full h-7 pl-8 pr-3 rounded-md border border-border/60 bg-background text-[11px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {visibleThreads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <Inbox className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-[12px]">No messages</p>
            </div>
          )}
          {visibleThreads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => setSelectedThreadId(thread.id)}
              className={`w-full text-left px-3 py-3 border-b border-border/30 transition-colors hover:bg-muted/30 ${
                selectedThreadId === thread.id ? "bg-brand/5 border-l-2 border-l-brand" : ""
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    !thread.isRead ? "bg-brand/20 text-brand" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {thread.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-[12px] truncate ${!thread.isRead ? "font-bold" : "font-medium"}`}
                    >
                      {thread.from}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                      {thread.time.split(",")[0]}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{thread.campaign}</p>
                  <p
                    className={`text-[11px] truncate mt-0.5 ${!thread.isRead ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {thread.preview}
                  </p>
                  {thread.tag && (
                    <span className="inline-block mt-1 text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full">
                      {thread.tag}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Email thread view */}
      <div className="flex-1 overflow-hidden flex flex-col min-w-0">
        {selectedThread ? (
          <>
            {/* Thread header */}
            <div className="px-5 py-3.5 border-b border-border/60 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-[14px] font-semibold">{selectedThread.from}</h2>
                    {selectedThread.tag && (
                      <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        {selectedThread.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{selectedThread.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Tag className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* AI Reply Agent prompt */}
              <div className="mt-3 rounded-lg border border-brand/20 bg-brand/5 p-2.5 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-md bg-brand/15 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-brand">Reply agent by SmartAgents</p>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Let agent draft your replies while you focus on closing deals.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-[10px] font-semibold text-brand border border-brand/30 rounded-md px-2 py-1 hover:bg-brand/10 transition-colors shrink-0"
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Subject line */}
            <div className="px-5 py-2.5 border-b border-border/40 shrink-0 bg-muted/10">
              <p className="text-[13px] font-semibold">{selectedThread.subject}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Campaign: {selectedThread.campaign}
              </p>
            </div>

            {/* Thread messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {selectedThread.thread.map((msg, i) => {
                const isSelf = msg.from === selfName;
                return (
                  <div key={msg.id} className={`flex gap-3 ${isSelf ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                        isSelf ? "bg-brand/20 text-brand" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {msg.from
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div
                      className={`flex-1 max-w-[85%] ${isSelf ? "items-end" : "items-start"} flex flex-col gap-1`}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-[12px] font-semibold">{msg.from}</span>
                        <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                      </div>
                      <div
                        className={`rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed whitespace-pre-wrap ${
                          isSelf
                            ? "bg-brand/10 border border-brand/20 text-foreground"
                            : "bg-muted/40 border border-border/50 text-foreground"
                        }`}
                      >
                        {msg.body}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply box */}
            <div className="border-t border-border/60 px-5 py-3 shrink-0">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${selectedThread.from}…`}
                rows={3}
                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2.5 text-[12px] placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-1 focus:ring-brand/40"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Bot className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Button size="sm" className="h-7 text-[11px]" disabled={!replyText.trim()}>
                  <Send className="w-3 h-3 mr-1.5" />
                  Send Reply
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Inbox className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-[13px]">Select a message to read</p>
          </div>
        )}
      </div>
    </div>
  );
}
