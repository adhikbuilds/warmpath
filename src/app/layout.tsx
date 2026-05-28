import type { Metadata } from "next";
import { Geist, Geist_Mono, Hanken_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/query-provider";
import { AuthSessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "WarmBlue — Turn cold prospects into warm intros",
  description:
    "The first sales agent built on your team's relationship graph. Find warm paths, detect buying signals, and approve AI-drafted outreach in minutes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${hankenGrotesk.variable} ${geist.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <AuthSessionProvider>
            <QueryProvider>{children}</QueryProvider>
            <Toaster
              richColors
              closeButton
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "#201f22",
                  border: "1px solid #464554",
                  color: "#e5e1e4",
                },
              }}
            />
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
