"use client";

import { AlertTriangle, Bot, CheckCircle2, Inbox, Link2, Loader2, Search, Wifi } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  variant?: "empty" | "error" | "no-results" | "no-path" | "done" | "no-connection" | "generating";
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  size?: "sm" | "md" | "lg";
  className?: string;
}

const STICKERS: Record<
  NonNullable<EmptyStateProps["variant"]>,
  { Icon: LucideIcon; bg: string; iconColor: string; defaultTitle: string; defaultDesc: string }
> = {
  empty: {
    Icon: Inbox,
    bg: "bg-muted/60",
    iconColor: "text-muted-foreground",
    defaultTitle: "Nothing here yet",
    defaultDesc: "Items will appear here once created.",
  },
  error: {
    Icon: AlertTriangle,
    bg: "bg-red-500/10",
    iconColor: "text-red-500",
    defaultTitle: "Something went wrong",
    defaultDesc: "An unexpected error occurred. Try refreshing or contact support.",
  },
  "no-results": {
    Icon: Search,
    bg: "bg-muted/60",
    iconColor: "text-muted-foreground",
    defaultTitle: "No results found",
    defaultDesc: "Try adjusting your search or filters.",
  },
  "no-path": {
    Icon: Link2,
    bg: "bg-brand/10",
    iconColor: "text-brand",
    defaultTitle: "No warm path found",
    defaultDesc: "No shared connection within 3 hops. Expand your network or try cold outreach.",
  },
  done: {
    Icon: CheckCircle2,
    bg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    defaultTitle: "All caught up",
    defaultDesc: "Nothing left to review here.",
  },
  "no-connection": {
    Icon: Wifi,
    bg: "bg-muted/60",
    iconColor: "text-muted-foreground",
    defaultTitle: "Connection issue",
    defaultDesc: "Check your network and try again.",
  },
  generating: {
    Icon: Bot,
    bg: "bg-violet-500/10",
    iconColor: "text-violet-500",
    defaultTitle: "Agent working…",
    defaultDesc: "Your AI agent is generating content. This usually takes a few seconds.",
  },
};

export function EmptyState({
  variant = "empty",
  title,
  description,
  action,
  size = "md",
  className,
}: EmptyStateProps) {
  const s = STICKERS[variant];
  const { Icon } = s;
  const isGenerating = variant === "generating";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-4",
        size === "sm" && "py-8",
        size === "md" && "py-14",
        size === "lg" && "py-20",
        className,
      )}
    >
      <div
        className={cn(
          "rounded-2xl flex items-center justify-center mb-4",
          s.bg,
          size === "sm" && "w-12 h-12",
          size === "md" && "w-16 h-16",
          size === "lg" && "w-20 h-20",
        )}
        role="img"
        aria-hidden
      >
        <Icon
          className={cn(
            s.iconColor,
            isGenerating && "animate-spin",
            size === "sm" && "w-5 h-5",
            size === "md" && "w-7 h-7",
            size === "lg" && "w-9 h-9",
          )}
        />
      </div>
      <h3 className={cn("font-semibold mb-1.5", size === "sm" ? "text-xs" : "text-sm")}>
        {title ?? s.defaultTitle}
      </h3>
      <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed">
        {description ?? s.defaultDesc}
      </p>
      {action && (
        <Button size="sm" className="mt-4 h-8 text-xs" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
