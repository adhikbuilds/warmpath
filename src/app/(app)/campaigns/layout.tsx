"use client";

import { Inbox, Mail, Server } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/campaigns", label: "Email Campaigns", icon: Mail },
  { href: "/campaigns/inbox", label: "Master Inbox", icon: Inbox },
  { href: "/campaigns/email-accounts", label: "Email Accounts", icon: Server },
];

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/campaigns") {
      return (
        pathname === "/campaigns" ||
        (pathname.startsWith("/campaigns/") &&
          !pathname.startsWith("/campaigns/inbox") &&
          !pathname.startsWith("/campaigns/email-accounts"))
      );
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Campaigns sub-sidebar */}
      <div className="w-[188px] shrink-0 border-r border-border/60 bg-card/30 flex flex-col pt-4 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 mb-2.5">
          Outreach
        </p>
        <nav className="space-y-0.5 px-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-hidden min-w-0">{children}</div>
    </div>
  );
}
