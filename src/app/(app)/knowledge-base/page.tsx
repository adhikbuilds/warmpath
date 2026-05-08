"use client";

import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Edit3,
  Plus,
  Shield,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  {
    value: "value_prop",
    label: "Value Prop",
    color: "bg-brand/10 text-brand border-brand/20",
  },
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
  {
    value: "objection",
    label: "Objection",
    color: "bg-brand/10 text-brand border-brand/20",
  },
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
  { value: "faq", label: "FAQ", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
  { value: "custom", label: "Custom", color: "bg-muted text-muted-foreground" },
];

function typeConfig(type: KBItemType) {
  return KB_TYPES.find((t) => t.value === type) ?? KB_TYPES[KB_TYPES.length - 1];
}

function AIReadinessScore({ items }: { items: KnowledgeBaseItem[] }) {
  const approved = items.filter((i) => i.approved_for_ai).length;
  const score = items.length > 0 ? Math.round((approved / items.length) * 100) : 0;
  const hasProduct = items.some((i) => i.type === "product" && i.approved_for_ai);
  const hasValueProp = items.some((i) => i.type === "value_prop" && i.approved_for_ai);
  const hasCaseStudy = items.some((i) => i.type === "case_study" && i.approved_for_ai);
  const hasCompliance = items.some((i) => i.type === "compliance" && i.approved_for_ai);

  const gaps = [
    !hasProduct && "Product overview",
    !hasValueProp && "Value proposition",
    !hasCaseStudy && "Case study",
    !hasCompliance && "Approved claims",
  ].filter(Boolean) as string[];

  return (
    <Card
      className={`border-border/60 ${score >= 80 ? "border-emerald-500/30 bg-emerald-500/5" : score >= 60 ? "border-brand/30 bg-brand/5" : "border-red-500/30 bg-red-500/5"}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${score >= 80 ? "bg-emerald-500/10 text-emerald-500" : score >= 60 ? "bg-brand/10 text-brand" : "bg-red-500/10 text-red-500"}`}
            >
              {score}%
            </div>
            <div>
              <p className="text-sm font-semibold">AI Readiness Score</p>
              <p className="text-xs text-muted-foreground">
                {approved} of {items.length} items approved for AI use
              </p>
            </div>
          </div>
          <div className="text-right">
            {gaps.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-brand mb-1">Missing for full readiness:</p>
                {gaps.map((g) => (
                  <p key={g} className="text-[10px] text-muted-foreground">
                    · {g}
                  </p>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-500">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Fully ready</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AddItemFormProps {
  onSave: (
    item: Omit<
      KnowledgeBaseItem,
      "id" | "workspace_id" | "created_at" | "updated_at" | "used_in_messages"
    >,
  ) => void;
  onCancel: () => void;
}

function AddItemForm({ onSave, onCancel }: AddItemFormProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<KBItemType>("product");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [tags, setTags] = useState("");
  const [approvedForAI, setApprovedForAI] = useState(true);

  return (
    <Card className="border-brand/30 bg-brand/5">
      <CardContent className="p-4 space-y-3">
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
            className="text-sm resize-none h-24"
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
              placeholder="e.g. Sales team, Legal review"
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
      </CardContent>
    </Card>
  );
}

interface KBItemCardProps {
  item: KnowledgeBaseItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleApproval: () => void;
}

function KBItemCard({ item, onEdit, onDelete, onToggleApproval }: KBItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = typeConfig(item.type);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const { updateKBItem } = useSalesStore();

  return (
    <Card
      className={`border-border/60 transition-colors ${item.approved_for_ai ? "border-emerald-500/20" : ""}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                {config.label}
              </Badge>
              <span className="text-sm font-medium">{item.title}</span>
              {item.approved_for_ai && (
                <Badge
                  variant="outline"
                  className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                >
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                  AI-approved
                </Badge>
              )}
              {item.used_in_messages > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  Used in {item.used_in_messages} msg{item.used_in_messages !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2 mt-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="text-xs resize-none h-28"
                />
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={() => {
                      updateKBItem(item.id, { content: editContent });
                      setIsEditing(false);
                      toast.success("KB item updated");
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px]"
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
                className={`text-xs text-muted-foreground leading-relaxed ${expanded ? "" : "line-clamp-2"}`}
              >
                {item.content}
              </p>
            )}

            {item.tags.length > 0 && (
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <Tag className="w-2.5 h-2.5 text-muted-foreground" />
                {item.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] text-muted-foreground border border-border/40 rounded px-1"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                title={item.approved_for_ai ? "Revoke AI approval" : "Approve for AI"}
                onClick={onToggleApproval}
                className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${item.approved_for_ai ? "text-emerald-500 hover:bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Edit"
                onClick={() => {
                  setIsEditing(!isEditing);
                  onEdit();
                }}
                className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Delete"
                onClick={onDelete}
                className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] text-muted-foreground flex items-center gap-0.5 hover:text-foreground"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  More
                </>
              )}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function KnowledgeBasePage() {
  const { kbItems, addKBItem, deleteKBItem, toggleKBItemApproval } = useSalesStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState<KBItemType | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = kbItems.filter((item) => {
    const matchType = typeFilter === "all" || item.type === typeFilter;
    const matchSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  const approvedCount = kbItems.filter((i) => i.approved_for_ai).length;
  const totalUsed = kbItems.reduce((s, i) => s + i.used_in_messages, 0);

  return (
    <div className="p-6 space-y-5 max-w-[1000px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand" />
            Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            The AI reads these docs before generating every message. Keep it current and approved.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add item
        </Button>
      </div>

      <AIReadinessScore items={kbItems} />

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total items", value: kbItems.length, color: "" },
          { label: "AI-approved", value: approvedCount, color: "text-emerald-500" },
          {
            label: "Needs review",
            value: kbItems.length - approvedCount,
            color: kbItems.length - approvedCount > 0 ? "text-brand" : "",
          },
          { label: "Times used in msgs", value: totalUsed, color: "text-brand" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-3 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showAddForm && (
        <AddItemForm
          onSave={(item) => {
            addKBItem(item);
            setShowAddForm(false);
            toast.success("Knowledge base item added");
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Input
            placeholder="Search knowledge base..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as KBItemType | "all")}>
          <SelectTrigger className="h-8 text-sm w-[160px]">
            <SelectValue placeholder="Filter by type" />
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
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} items</span>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No items found</p>
            <p className="text-xs mt-1">Try a different filter or add your first KB item</p>
          </div>
        ) : (
          filtered.map((item) => (
            <KBItemCard
              key={item.id}
              item={item}
              onEdit={() => {}}
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
    </div>
  );
}
