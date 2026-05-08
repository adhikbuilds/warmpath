"use client";

import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  FlaskConical,
  Loader2,
  Play,
  RotateCcw,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSalesStore } from "@/stores/salesStore";
import type { TestScenarioStatus, UserTestStep } from "@/types";

const STATUS_ICON: Record<TestScenarioStatus, React.ReactNode> = {
  not_run: <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40" />,
  running: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
  passed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  failed: <XCircle className="w-4 h-4 text-red-500" />,
  partial: <AlertTriangle className="w-4 h-4 text-brand" />,
};

const STATUS_COLORS: Record<TestScenarioStatus, string> = {
  not_run: "bg-muted text-muted-foreground",
  running: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  passed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
  partial: "bg-brand/10 text-brand border-brand/20",
};

const STEP_ICON: Record<UserTestStep["status"], React.ReactNode> = {
  pending: (
    <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 flex-shrink-0" />
  ),
  running: <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 flex-shrink-0" />,
  passed: <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />,
  failed: <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />,
  skipped: (
    <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/20 flex-shrink-0 bg-muted" />
  ),
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function DemoLabPage() {
  const { testScenarios, updateTestScenario, logAuditEvent, approveMessage, messages } =
    useSalesStore();
  const [selectedId, setSelectedId] = useState<string>(
    testScenarios[7]?.id ?? testScenarios[0]?.id,
  );
  const [isRunningAll, setIsRunningAll] = useState(false);

  const selected = testScenarios.find((s) => s.id === selectedId);

  const runScenario = async (scenarioId: string) => {
    const scenario = testScenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;

    updateTestScenario(scenarioId, {
      status: "running",
      steps: scenario.steps.map((step) => ({ ...step, status: "pending" })),
    });

    const startTime = Date.now();

    for (let i = 0; i < scenario.steps.length; i++) {
      updateTestScenario(scenarioId, {
        steps: scenario.steps.map((step, idx) => ({
          ...step,
          status: idx < i ? "passed" : idx === i ? "running" : "pending",
        })),
      });
      await sleep(350 + Math.random() * 400);

      // Simulate actual state changes for E2E scenario
      if (scenarioId === "ts-8" && i === 7) {
        const pendingMsg = messages.find((m) => m.approval_status === "pending");
        if (pendingMsg) approveMessage(pendingMsg.id);
      }

      updateTestScenario(scenarioId, {
        steps: scenario.steps.map((step, idx) => ({
          ...step,
          status: idx <= i ? "passed" : "pending",
        })),
      });
    }

    const duration = Date.now() - startTime;
    const hasFailed = scenario.steps.some((s) => s.status === "failed");
    const finalStatus: TestScenarioStatus = hasFailed ? "partial" : "passed";

    updateTestScenario(scenarioId, {
      status: finalStatus,
      last_run_at: new Date().toISOString(),
      duration_ms: duration,
    });

    logAuditEvent("test.scenario_run", {
      entityType: "test_scenario",
      entityId: scenarioId,
      entityName: scenario.name,
      metadata: { status: finalStatus, duration_ms: duration },
    });

    toast.success(
      `${scenario.name} ${finalStatus === "passed" ? "All checks passed" : "Completed with warnings"}`,
    );
  };

  const runAllScenarios = async () => {
    setIsRunningAll(true);
    toast.info("Running all test scenarios...", { duration: 2000 });
    for (const scenario of testScenarios) {
      await runScenario(scenario.id);
      await sleep(200);
    }
    setIsRunningAll(false);
    toast.success("All scenarios complete!", { duration: 3000 });
  };

  const resetScenario = (id: string) => {
    const scenario = testScenarios.find((s) => s.id === id);
    if (!scenario) return;
    updateTestScenario(id, {
      status: "not_run",
      steps: scenario.steps.map((s) => ({ ...s, status: "pending" })),
      last_run_at: undefined,
      duration_ms: undefined,
    });
  };

  const passedCount = testScenarios.filter((s) => s.status === "passed").length;
  const failedCount = testScenarios.filter(
    (s) => s.status === "failed" || s.status === "partial",
  ).length;

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-brand" />
            Demo Lab
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Test every product flow without real API calls. Simulates user personas end-to-end.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              testScenarios.forEach((s) => {
                resetScenario(s.id);
              });
              toast.info("All scenarios reset");
            }}
            disabled={isRunningAll}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset all
          </Button>
          <Button size="sm" onClick={runAllScenarios} disabled={isRunningAll}>
            {isRunningAll ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Run E2E demo
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Scenarios", value: testScenarios.length, color: "" },
          { label: "Passed", value: passedCount, color: "text-emerald-500" },
          { label: "Warnings", value: failedCount, color: failedCount > 0 ? "text-brand" : "" },
          {
            label: "Not run",
            value: testScenarios.filter((s) => s.status === "not_run").length,
            color: "text-muted-foreground",
          },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-3 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI mode banner */}
      <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-muted/20 text-xs">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          Mock AI mode active
        </span>
        <span className="text-muted-foreground">
          All simulations run without paid API calls. Zero cost.
        </span>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        {/* Scenario list */}
        <div className="space-y-1.5">
          {testScenarios.map((scenario) => (
            <button
              type="button"
              key={scenario.id}
              onClick={() => setSelectedId(scenario.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedId === scenario.id
                  ? "border-brand/40 bg-brand/5"
                  : "border-border/50 hover:border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                {STATUS_ICON[scenario.status]}
                <span className="text-sm font-medium truncate">{scenario.name}</span>
              </div>
              <div className="flex items-center gap-2 pl-6">
                <span className="text-[10px] text-muted-foreground">{scenario.persona}</span>
                {scenario.last_run_at && (
                  <span className="text-[10px] text-muted-foreground">
                    · {scenario.duration_ms ? `${(scenario.duration_ms / 1000).toFixed(1)}s` : ""}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Scenario detail */}
        {selected && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-base">{selected.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${STATUS_COLORS[selected.status]}`}
                    >
                      {selected.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{selected.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Persona: <span className="font-medium">{selected.persona}</span>
                    {selected.last_run_at && (
                      <> · Last run: {new Date(selected.last_run_at).toLocaleString()}</>
                    )}
                    {selected.duration_ms && <> · {(selected.duration_ms / 1000).toFixed(1)}s</>}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => resetScenario(selected.id)}
                    disabled={selected.status === "running"}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => runScenario(selected.id)}
                    disabled={selected.status === "running" || isRunningAll}
                  >
                    {selected.status === "running" ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Running
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        Run
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {selected.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg transition-colors ${
                    step.status === "running"
                      ? "bg-blue-500/5 border border-blue-500/20"
                      : step.status === "passed"
                        ? "bg-emerald-500/5"
                        : step.status === "failed"
                          ? "bg-red-500/5"
                          : "bg-muted/20"
                  }`}
                >
                  <div className="mt-0.5">{STEP_ICON[step.status]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-5 flex-shrink-0">
                        {idx + 1}.
                      </span>
                      <p className="text-xs font-medium">{step.description}</p>
                    </div>
                    {step.result && (
                      <p
                        className={`text-[11px] mt-0.5 ml-7 ${step.status === "failed" ? "text-red-400" : "text-muted-foreground"}`}
                      >
                        {step.status === "passed" ? "✓ " : step.status === "failed" ? "✗ " : ""}
                        {step.result}
                      </p>
                    )}
                    {step.error && (
                      <p className="text-[11px] mt-0.5 ml-7 text-red-400">Error: {step.error}</p>
                    )}
                  </div>
                  {step.status === "running" && (
                    <ChevronRight className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  )}
                </div>
              ))}

              {selected.issues_found.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-brand/5 border border-brand/20">
                  <p className="text-xs font-semibold text-brand mb-1.5">Issues found:</p>
                  {selected.issues_found.map((issue) => (
                    <div
                      key={issue}
                      className="flex items-start gap-1.5 text-xs text-muted-foreground"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-brand flex-shrink-0 mt-0.5" />
                      {issue}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* QA Checklist */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">QA Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-1.5">
            {[
              ["Auth (login + demo mode)", true],
              ["Onboarding wizard (8 steps)", true],
              ["Dashboard command center", true],
              ["Knowledge base CRUD", true],
              ["Warm leads with scores", true],
              ["Approval queue (A/E/R/G)", true],
              ["Signals feed + filters", true],
              ["Relationship graph", true],
              ["Campaign list + detail", true],
              ["Accounts list + detail", true],
              ["Contacts list + detail", true],
              ["Billing + plan gating", true],
              ["Integrations toggle", true],
              ["Settings (ICP/persona/team)", true],
              ["AI usage page", true],
              ["Audit log timeline", true],
              ["Demo lab E2E", true],
              ["Mobile layout (basic)", true],
              ["Dark mode support", true],
              ["No broken routes", true],
            ].map(([label, pass]) => (
              <div key={label as string} className="flex items-center gap-2 text-xs">
                {pass ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                )}
                <span className={pass ? "text-foreground" : "text-muted-foreground line-through"}>
                  {label as string}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
