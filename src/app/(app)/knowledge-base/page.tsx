"use client";

import {
  BookOpen,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit3,
  Plus,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSalesStore } from "@/stores/salesStore";
import type { KBItemType, KnowledgeBaseItem } from "@/types";

const KB_TYPES: { value: KBItemType; label: string; color: string }[] = [
  { value: "product", label: "Product", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { value: "value_prop", label: "Value Prop", color: "bg-brand/10 text-brand border-brand/20" },
  {
    value: "pricing",
    label: "Pricing",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  {
    value: "case_study",
    label: "Case Study",
    color: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  },
  {
    value: "competitor",
    label: "Competitor",
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
  { value: "objection", label: "Objection", color: "bg-brand/10 text-brand border-brand/20" },
  { value: "icp", label: "ICP", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
  {
    value: "compliance",
    label: "Compliance",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  { value: "persona", label: "Persona", color: "bg-pink-500/10 text-pink-500 border-pink-500/20" },
  {
    value: "playbook",
    label: "Playbook",
    color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  },
  {
    value: "email_example",
    label: "Email Example",
    color: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  },
  { value: "faq", label: "FAQ", color: "bg-[#908fa0]/10 text-[#908fa0] border-[#908fa0]/20" },
  { value: "custom", label: "Custom", color: "bg-muted text-muted-foreground" },
];

function typeConfig(type: KBItemType) {
  return KB_TYPES.find((t) => t.value === type) ?? KB_TYPES[KB_TYPES.length - 1];
}

// ─── Chat types ───────────────────────────────────────────────────────────────

type ThinkingStep = { text: string; done: boolean };

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: ThinkingStep[];
  thinkingDone?: boolean;
  thinkingExpanded?: boolean;
  sources?: string[];
};


// ─── Add Item Form ────────────────────────────────────────────────────────────

function AddItemForm({
  onSave,
  onCancel,
}: {
  onSave: (
    item: Omit<
      KnowledgeBaseItem,
      "id" | "workspace_id" | "created_at" | "updated_at" | "used_in_messages"
    >,
  ) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<KBItemType>("product");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [tags, setTags] = useState("");
  const [approvedForAI, setApprovedForAI] = useState(true);

  return (
    <div className="border border-brand/30 bg-brand/5 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold">Add knowledge base item</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-8 text-sm"
            placeholder="e.g. Product Overview"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as KBItemType)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KB_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs mb-1 block">Content</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="text-sm resize-none h-20"
          placeholder="Write the knowledge base content here..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Source (optional)</Label>
          <Input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="h-8 text-sm"
            placeholder="e.g. Legal review"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Tags (comma-separated)</Label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="h-8 text-sm"
            placeholder="pitch, product, ai"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setApprovedForAI(!approvedForAI)}
          className={`relative w-9 h-5 rounded-full transition-colors ${approvedForAI ? "bg-primary" : "bg-muted"}`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${approvedForAI ? "left-4" : "left-0.5"}`}
          />
        </button>
        <span className="text-xs">Approved for AI use</span>
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            if (!title.trim() || !content.trim()) {
              toast.error("Title and content are required");
              return;
            }
            onSave({
              title: title.trim(),
              type,
              content: content.trim(),
              source: source.trim() || undefined,
              tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
              confidence_score: 80,
              approved_for_ai: approvedForAI,
            });
          }}
        >
          Save item
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── KB Item Card (compact for left pane) ─────────────────────────────────────

function KBItemCard({
  item,
  onDelete,
  onToggleApproval,
  highlighted,
}: {
  item: KnowledgeBaseItem;
  onDelete: () => void;
  onToggleApproval: () => void;
  highlighted?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const { updateKBItem } = useSalesStore();
  const config = typeConfig(item.type);

  return (
    <div
      className={`rounded-lg border p-3 transition-all ${highlighted ? "border-brand/40 bg-brand/5" : "border-border/50 bg-card"} ${item.approved_for_ai ? "border-l-2 border-l-emerald-500/50" : ""}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <Badge variant="outline" className={`text-[9px] px-1 py-0 ${config.color}`}>
              {config.label}
            </Badge>
            <span className="text-[12px] font-medium truncate">{item.title}</span>
            {item.approved_for_ai && <Sparkles className="w-2.5 h-2.5 text-emerald-500 shrink-0" />}
          </div>
          {isEditing ? (
            <div className="space-y-1.5 mt-1.5">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="text-xs resize-none h-20"
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className="h-5 text-[10px] px-2"
                  onClick={() => {
                    updateKBItem(item.id, { content: editContent });
                    setIsEditing(false);
                    toast.success("Updated");
                  }}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-5 text-[10px] px-2"
                  onClick={() => {
                    setEditContent(item.content);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p
              className={`text-[11px] text-muted-foreground leading-relaxed ${expanded ? "" : "line-clamp-2"}`}
            >
              {item.content}
            </p>
          )}
          {item.tags.length > 0 && (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <Tag className="w-2.5 h-2.5 text-muted-foreground" />
              {item.tags.map((t) => (
                <span
                  key={t}
                  className="text-[9px] text-muted-foreground border border-border/40 rounded px-1"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onToggleApproval}
              title={item.approved_for_ai ? "Revoke" : "Approve"}
              className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${item.approved_for_ai ? "text-emerald-500 hover:bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Shield className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-[9px] text-muted-foreground flex items-center gap-0.5 hover:text-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-2.5 h-2.5" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="w-2.5 h-2.5" />
                More
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Chat Panel ────────────────────────────────────────────────────────────

function AIChatPanel({ items }: { items: KnowledgeBaseItem[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Ask me anything about your knowledge base — I'll ground my answer in your approved content and show you exactly what I'm thinking.",
      thinking: [],
      thinkingDone: true,
      thinkingExpanded: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const SUGGESTED = [
    "What's our main value proposition?",
    "How do we handle objections about pricing?",
    "Who is our ideal customer profile?",
    "What competitors should I be aware of?",
  ];

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;
    setInput("");
    setIsLoading(true);

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      thinking: [],
      thinkingDone: false,
      thinkingExpanded: true,
      sources: [],
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    // Show a "searching" thinking step while the real API responds
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? { ...m, thinking: [{ text: "Searching knowledge base…", done: false }] }
          : m,
      ),
    );

    try {
      const r = await fetch("/api/knowledge-base/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const d = await r.json();
      const answer: string = d.answer ?? "I could not find a relevant answer.";
      const sources: string[] = d.sources ?? [];

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                thinkingDone: true,
                thinking: [
                  { text: "Searching knowledge base…", done: true },
                  { text: d.used_azure ? "Answered via Azure OpenAI" : "Answered via keyword match", done: true },
                ],
                content: answer,
                sources,
                thinkingExpanded: false,
              }
            : m,
        ),
      );

      // Highlight referenced KB items
      const refItems = items.filter((item) => sources.includes(item.title));
      if (refItems.length > 0) {
        setHighlightedItems(new Set(refItems.map((i) => i.id)));
        setTimeout(() => setHighlightedItems(new Set()), 4000);
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, thinkingDone: true, content: "Failed to get answer. Please try again.", thinkingExpanded: false }
            : m,
        ),
      );
    }

    setIsLoading(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-brand/10 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-brand" />
          </div>
          <span className="text-sm font-semibold">KB Assistant</span>
          <Badge
            variant="outline"
            className="text-[9px] bg-brand/10 text-brand border-brand/20 ml-1"
          >
            thinks out loud
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" ? (
              <div className="max-w-[90%] space-y-1.5">
                {/* Thinking block */}
                {msg.thinking && msg.thinking.length > 0 && (
                  <div className="border border-brand/20 rounded-lg overflow-hidden bg-brand/5">
                    <button
                      type="button"
                      onClick={() =>
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === msg.id ? { ...m, thinkingExpanded: !m.thinkingExpanded } : m,
                          ),
                        )
                      }
                      className="w-full flex items-center gap-2 px-3 py-2 text-left"
                    >
                      <Brain
                        className={`w-3 h-3 text-brand shrink-0 ${!msg.thinkingDone ? "animate-pulse" : ""}`}
                      />
                      <span className="text-[11px] font-medium text-brand flex-1">
                        {msg.thinkingDone ? "Thinking (done)" : "Thinking…"}
                      </span>
                      {msg.thinkingExpanded ? (
                        <ChevronUp className="w-3 h-3 text-brand/60" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-brand/60" />
                      )}
                    </button>
                    {msg.thinkingExpanded && (
                      <div className="px-3 pb-2.5 space-y-1.5 border-t border-brand/10">
                        {msg.thinking?.map((step, i) => (
                          <div key={i} className="flex items-start gap-2">
                            {step.done ? (
                              <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                            ) : (
                              <div className="w-3 h-3 rounded-full border border-brand/50 mt-0.5 shrink-0 animate-pulse" />
                            )}
                            <span className="text-[11px] text-muted-foreground leading-relaxed">
                              {step.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Answer */}
                {msg.content && (
                  <div className="bg-card border border-border/50 rounded-xl px-3.5 py-2.5">
                    <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">Sources:</span>
                        {msg.sources.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] bg-brand/10 text-brand border border-brand/20 rounded px-1.5 py-0.5"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-[85%] bg-brand text-white rounded-xl px-3.5 py-2.5">
                <p className="text-[12px]">{msg.content}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => sendMessage(s)}
              className="text-[11px] border border-border/50 rounded-full px-2.5 py-1 text-muted-foreground hover:text-foreground hover:border-brand/40 hover:bg-brand/5 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-border/50 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask about your knowledge base…"
            rows={1}
            className="flex-1 text-[12px] resize-none rounded-lg border border-border bg-card px-3 py-2 outline-none focus:border-brand/50 transition-colors"
            style={{ minHeight: 36, maxHeight: 100 }}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-brand text-white disabled:opacity-40 transition-opacity shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          Answers are grounded in approved KB items only · Shift+Enter for newline
        </p>
      </div>
    </div>
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void highlightedItems;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

export default function KnowledgeBasePage() {
  const { kbItems, addKBItem, deleteKBItem, toggleKBItemApproval, initialize } = useSalesStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState<KBItemType | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/knowledge-base/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Upload failed");
      toast.success(`Imported ${d.created} KB item${d.created !== 1 ? "s" : ""} — review and approve for AI use`);
      initialize();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const filtered = kbItems.filter((item) => {
    const matchType = typeFilter === "all" || item.type === typeFilter;
    const matchSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const approvedCount = kbItems.filter((i) => i.approved_for_ai).length;

  // Reset page when filter changes
  const handleFilterChange = (v: string) => {
    setTypeFilter(v as KBItemType | "all");
    setPage(0);
  };
  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(0);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left pane: KB items ── */}
      <div className="w-[420px] shrink-0 border-r border-border flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border/50 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-[14px] font-semibold flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-brand" />
                Knowledge Base
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {approvedCount}/{kbItems.length} approved for AI
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.txt,.md"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] pointer-events-none"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    {uploading ? (
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3 mr-1" />
                    )}
                    {uploading ? "…" : "Upload"}
                  </span>
                </Button>
              </label>
              <Button
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex gap-2 mb-3">
            {[
              { label: "Total", value: kbItems.length },
              { label: "AI-ready", value: approvedCount, color: "text-emerald-500" },
              {
                label: "Needs review",
                value: kbItems.length - approvedCount,
                color: kbItems.length - approvedCount > 0 ? "text-amber-500" : "",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex-1 text-center border border-border/40 rounded-lg py-1.5"
              >
                <div className={`text-[13px] font-bold ${s.color ?? ""}`}>{s.value}</div>
                <div className="text-[9px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Input
              placeholder="Search knowledge base…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-7 text-[11px] pr-6"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearch("")}
                className="absolute right-2 top-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Type filter */}
          <Select value={typeFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {KB_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="px-3 py-3 border-b border-border/50 shrink-0">
            <AddItemForm
              onSave={(item) => {
                addKBItem(item);
                setShowAddForm(false);
                toast.success("KB item added");
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Items list — 5 at a time */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {paginated.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p className="text-[11px]">No items found</p>
            </div>
          ) : (
            paginated.map((item) => (
              <KBItemCard
                key={item.id}
                item={item}
                onDelete={() => {
                  deleteKBItem(item.id);
                  toast.success("Item deleted");
                }}
                onToggleApproval={() => {
                  toggleKBItemApproval(item.id);
                  const current = kbItems.find((k) => k.id === item.id);
                  toast.success(
                    current?.approved_for_ai ? "AI approval revoked" : "Item approved for AI",
                  );
                }}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="px-3 py-2 border-t border-border/50 shrink-0 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""} · page {page + 1}/{totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Right pane: AI chatbot ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AIChatPanel items={kbItems} />
      </div>
    </div>
  );
}
