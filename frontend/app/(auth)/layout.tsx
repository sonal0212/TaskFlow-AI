import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — form */}
      <div className="flex flex-col">
        <header className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <span className="font-display text-sm leading-none">τ</span>
            </span>
            <span className="font-semibold tracking-tight">TaskFlow AI</span>
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>

      {/* Right — editorial panel */}
      <aside className="relative hidden overflow-hidden border-l border-border bg-card lg:block">
        <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div />
          <blockquote className="max-w-md">
            <p className="font-display text-3xl leading-snug tracking-tight text-balance">
              "It feels less like a board and more like a colleague who's already
              read the project and knows what to do next."
            </p>
            <footer className="mt-6 text-sm text-muted-foreground">
              — Marco Bianchi, Engineering Lead
            </footer>
          </blockquote>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>Real-time at &lt;250 ms</span>
            <span>·</span>
            <span>OWASP ASVS L2</span>
            <span>·</span>
            <span>WCAG 2.1 AA</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
