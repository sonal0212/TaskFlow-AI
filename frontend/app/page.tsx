import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  Lock,
  Wand2,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold tracking-tight">TaskFlow AI</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#ai" className="hover:text-foreground transition-colors">AI</a>
            <a href="#security" className="hover:text-foreground transition-colors">Security</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-80" aria-hidden />
        <div className="absolute inset-0 bg-scanlines opacity-50" aria-hidden />
        {/* Radial neon wash */}
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[1200px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--neon-green) / 0.35), transparent 60%)",
          }}
          aria-hidden
        />
        <div className="container relative pb-24 pt-20 md:pb-32 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span>Powered by GPT-4o-mini · real-time at &lt; 250 ms</span>
            </div>

            <h1 className="font-display mt-6 text-5xl leading-[1.05] tracking-tight text-balance md:text-6xl lg:text-7xl">
              A task manager that{" "}
              <span className="text-primary text-glow-primary">thinks alongside you.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
              Capture, organise and prioritise work with an AI co-pilot that reads your
              workspace and proposes the next move — backed by real-time collaboration
              and a security posture you can defend.
            </p>

            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/signup">
                  Try the demo <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Sign in to your workspace</Link>
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              No credit card. Free tier: 1 workspace, 3 collaborators, 100 tasks.
            </p>
          </div>

          {/* Hero preview */}
          <div className="mx-auto mt-16 max-w-5xl">
            <BoardPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-card/40">
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">The platform</p>
            <h2 className="font-display mt-3 text-4xl tracking-tight md:text-5xl">
              Built for the way teams actually work.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <Feature
              icon={<Wand2 className="h-5 w-5" />}
              title="AI co-pilot"
              body="Ask for the next 5 tasks, auto-prioritise the backlog, or speak a sentence and get a structured task with assignee and due date."
            />
            <Feature
              icon={<Zap className="h-5 w-5" />}
              title="Real-time collaboration"
              body="STOMP-over-WebSocket fan-out keeps every client in sync within ~200 ms. Presence avatars and live cursors come standard."
            />
            <Feature
              icon={<Users className="h-5 w-5" />}
              title="Roles that matter"
              body="Owner, Admin, Member, Viewer — workspace-scoped with token-versioned revocation when you remove someone."
            />
            <Feature
              icon={<CalendarClock className="h-5 w-5" />}
              title="Daily standup, generated"
              body="Each morning, an AI digest of what shipped, what's in flight, and what's blocking — delivered before the meeting starts."
            />
            <Feature
              icon={<Lock className="h-5 w-5" />}
              title="Security you can defend"
              body="15-minute access tokens, 7-day rotating refresh tokens, Redis-backed blacklist, BCrypt-12 with pepper. ASVS L2."
            />
            <Feature
              icon={<Sparkles className="h-5 w-5" />}
              title="Cost-aware AI"
              body="GPT-4o-mini by default with structured outputs and 60 s response caching. Under $0.01 per active user per day."
            />
          </div>
        </div>
      </section>

      {/* AI section */}
      <section id="ai" className="border-t border-border/60">
        <div className="container py-20 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">AI as a first-class surface</p>
              <h2 className="font-display mt-3 text-4xl tracking-tight md:text-5xl">
                Type what you mean. Ship what matters.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                "Schedule a 30-minute review with Marco on Friday" becomes a task with the
                right assignee, due date, and duration — resolved against your workspace timezone.
              </p>
              <ul className="mt-8 space-y-4 text-sm">
                {[
                  "Suggest 5 next tasks, with diff before any write.",
                  "Auto-prioritise the backlog — you confirm before it lands.",
                  "Strict JSON-schema validation on every model response.",
                  "PII is stripped before any prompt leaves your perimeter.",
                ].map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <AiPreview />
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="border-t border-border/60 bg-card/40">
        <div className="container py-20">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-4">
            <Stat label="P95 WS latency" value="< 250 ms" />
            <Stat label="Cache hit rate" value="≥ 60 %" />
            <Stat label="LLM cost / DAU" value="< $0.01" />
            <Stat label="Token rotation" value="every refresh" />
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="container flex h-16 items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo small />
            <span>© {new Date().getFullYear()} TaskFlow AI</span>
          </div>
          <span>Built with Next.js, Spring Boot, Postgres &amp; Redis.</span>
        </div>
      </footer>
    </main>
  );
}

function Logo({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`grid ${small ? "h-5 w-5" : "h-7 w-7"} place-items-center rounded-md bg-primary text-primary-foreground shadow-[0_0_12px_-2px_hsl(var(--primary)/0.6)]`}
    >
      <span className={`font-display ${small ? "text-[11px]" : "text-sm"} leading-none font-bold`}>τ</span>
    </span>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="group rounded-lg border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-elevated">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-5 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-4xl tracking-tight">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function BoardPreview() {
  const cols = [
    { title: "To do", count: 4, accent: "bg-muted text-muted-foreground" },
    { title: "In progress", count: 3, accent: "bg-neon-cyan/15 text-neon-cyan" },
    { title: "Blocked", count: 1, accent: "bg-destructive/15 text-destructive" },
    { title: "Done", count: 6, accent: "bg-primary/15 text-primary" },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
        </div>
        <span className="ml-3 text-xs text-muted-foreground">atelier · Q2 Product Launch</span>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-4">
        {cols.map((c) => (
          <div key={c.title} className="rounded-lg border border-border bg-background/60 p-3">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="font-medium uppercase tracking-wider text-muted-foreground">
                {c.title}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${c.accent}`}>
                {c.count}
              </span>
            </div>
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-md border border-border bg-card p-3 shadow-soft"
                >
                  <div className="h-2 w-3/4 rounded-full bg-muted" />
                  <div className="mt-2 h-2 w-1/2 rounded-full bg-muted/60" />
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-primary/30" />
                    <div className="h-1.5 w-12 rounded-full bg-muted/80" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiPreview() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-elevated">
      <div className="flex items-center gap-2">
        <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-medium">Co-pilot</span>
      </div>
      <div className="mt-4 rounded-md bg-muted/50 p-3 text-sm">
        Schedule a 30-min review with Marco on Friday
      </div>
      <div className="mt-3 rounded-md border border-border bg-background p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Parsed</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <Field k="Title" v="Review with Marco" />
          <Field k="Assignee" v="Marco Bianchi" />
          <Field k="Due" v="Fri 02 May" />
          <Field k="Duration" v="30 min" />
        </div>
      </div>
      <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground">
        Add task <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="mt-0.5 font-medium">{v}</div>
    </div>
  );
}
