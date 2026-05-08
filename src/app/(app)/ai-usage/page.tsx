"use client";

import { Activity, CheckCircle, Cloud, Cpu, HardDrive, Info, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatRelativeTime } from "@/lib/utils";
import { useSalesStore } from "@/stores/salesStore";
import type { AIMode } from "@/types";

const MODE_CONFIG: Record<
  AIMode,
  {
    icon: React.ReactNode;
    label: string;
    description: string;
    color: string;
    costNote: string;
  }
> = {
  mock: {
    icon: <HardDrive className="w-4 h-4" />,
    label: "Mock AI",
    description: "Deterministic templates free, instant, no API calls",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    costNote: "$0.00 / generation",
  },
  local: {
    icon: <Cpu className="w-4 h-4" />,
    label: "Local LLM (Ollama)",
    description: "Calls Ollama at localhost:11434 free, private, requires setup",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    costNote: "$0.00 / generation (self-hosted)",
  },
  remote: {
    icon: <Cloud className="w-4 h-4" />,
    label: "Remote AI (Claude / GPT-4)",
    description: "Calls Anthropic or OpenAI highest quality, costs ~$0.01–0.05/message",
    color: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    costNote: "~$0.01–0.05 / generation",
  },
};

const ACTION_LABELS: Record<string, string> = {
  generate_message: "Generate message",
  analyze_risk: "Analyze risk",
  recommend_actions: "Recommend actions",
  summarize_icp: "Summarize ICP",
  kb_retrieval: "KB retrieval",
};

export default function AIUsagePage() {
  const { aiSettings, aiUsageLogs, updateAISettings } = useSalesStore();

  const currentMode = aiSettings.ai_mode;
  const config = MODE_CONFIG[currentMode];

  const successCount = aiUsageLogs.filter((l) => l.status === "success").length;
  const cacheHits = aiUsageLogs.filter((l) => l.cache_hit).length;
  const totalCost = aiUsageLogs.reduce((s, l) => s + l.estimated_cost, 0);
  const budgetUsed =
    aiSettings.monthly_budget_usd > 0
      ? (aiSettings.usage_this_month_usd / aiSettings.monthly_budget_usd) * 100
      : 0;

  return (
    <div className="p-6 space-y-5 max-w-[900px] mx-auto">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand" />
          AI Usage & Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Monitor AI mode, cost, and generation quality. Default: mock mode always free.
        </p>
      </div>

      {/* Mode selector */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">AI Mode</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3">
          {(["mock", "local", "remote"] as AIMode[]).map((mode) => {
            const c = MODE_CONFIG[mode];
            const isCurrent = currentMode === mode;
            return (
              <button
                type="button"
                key={mode}
                onClick={async () => {
                  if (mode === "remote") {
                    toast.info("Remote mode requires NEXT_PUBLIC_ANTHROPIC_API_KEY in .env.local");
                    return;
                  }
                  if (mode === "local") {
                    // Verify Ollama is reachable before switching
                    try {
                      const res = await fetch("http://localhost:11434/api/tags");
                      if (!res.ok) throw new Error("not ok");
                      const data = (await res.json()) as { models?: Array<{ name: string }> };
                      const models = data.models?.map((m) => m.name) ?? [];
                      updateAISettings({ ai_mode: mode });
                      toast.success(`Connected to Ollama ${models[0] ?? "no model"} ready`);
                    } catch {
                      toast.error(
                        "Ollama not reachable at http://localhost:11434. Start it with: ollama serve",
                      );
                    }
                    return;
                  }
                  updateAISettings({ ai_mode: mode });
                  toast.success(`Switched to ${c.label}`);
                }}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  isCurrent ? "border-brand/40 bg-brand/5" : "border-border/60 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="outline" className={`text-[10px] ${c.color}`}>
                    {c.icon}
                    <span className="ml-1">{c.label}</span>
                  </Badge>
                  {isCurrent && <CheckCircle className="w-3.5 h-3.5 text-brand ml-auto" />}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">{c.costNote}</p>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Current mode status */}
      <Card
        className={`border-2 ${currentMode === "mock" ? "border-emerald-500/30 bg-emerald-500/5" : currentMode === "local" ? "border-blue-500/30 bg-blue-500/5" : "border-violet-500/30 bg-violet-500/5"}`}
      >
        <CardContent className="p-4 flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${MODE_CONFIG[currentMode].color}`}
          >
            {config.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{config.label} is active</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono font-bold">$0.00</p>
            <p className="text-[10px] text-muted-foreground">this session</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Generations", value: aiUsageLogs.length, color: "" },
          { label: "Successful", value: successCount, color: "text-emerald-500" },
          { label: "Cache hits", value: cacheHits, color: "text-blue-500" },
          { label: "Total cost", value: `$${totalCost.toFixed(2)}`, color: "text-brand" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-3 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Monthly Budget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span>Remote AI budget limit</span>
              <span className="font-mono">
                ${aiSettings.usage_this_month_usd.toFixed(2)} / $
                {aiSettings.monthly_budget_usd.toFixed(2)}
              </span>
            </div>
            <Progress value={budgetUsed} className="h-2" />
            {currentMode === "mock" && (
              <p className="text-[10px] text-muted-foreground mt-1">
                <Info className="w-3 h-3 inline mr-1" />
                Mock mode uses $0 budget only applies to remote mode.
              </p>
            )}
          </div>

          <div className="space-y-2 pt-1 border-t border-border/50">
            {[
              { label: "Fallback to mock if remote fails", checked: aiSettings.fallback_to_mock },
              {
                label: "Require approval before remote generation",
                checked: aiSettings.require_approval_for_remote,
              },
              { label: "Allow remote generation", checked: aiSettings.allow_remote_generation },
            ].map(({ label, checked }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-xs">{label}</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${checked ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground"}`}
                >
                  {checked ? "On" : "Off"}
                </Badge>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Env vars for remote mode:</p>
            <code className="font-mono block">NEXT_PUBLIC_AI_MODE=remote</code>
            <code className="font-mono block">NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...</code>
            <code className="font-mono block text-muted-foreground">
              # or NEXT_PUBLIC_OPENAI_API_KEY=sk-...
            </code>
            <code className="font-mono block text-muted-foreground">
              # or NEXT_PUBLIC_OLLAMA_BASE_URL=http://localhost:11434
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Usage log */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Recent AI activity ({aiUsageLogs.length} events)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {aiUsageLogs.slice(0, 15).map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0"
            >
              <div
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.status === "success" ? "bg-emerald-500" : log.status === "cached" ? "bg-blue-500" : "bg-red-500"}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">
                    {ACTION_LABELS[log.action_type] ?? log.action_type}
                  </span>
                  <Badge variant="outline" className="text-[9px]">
                    {log.provider}
                  </Badge>
                  {log.cache_hit && (
                    <Badge
                      variant="outline"
                      className="text-[9px] bg-blue-500/10 text-blue-500 border-blue-500/20"
                    >
                      cached
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">model: {log.model}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-mono">${log.estimated_cost.toFixed(4)}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(log.created_at)}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="text-center py-3">
        <p className="text-xs text-muted-foreground">
          WarmPath defaults to mock mode full functionality, zero cost. Switch to remote only
          when you're ready to go live.
        </p>
      </div>
    </div>
  );
}
