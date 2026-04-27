"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const router = useRouter();
  const login = useStore((s) => s.login);
  const { toast } = useToast();
  const [email, setEmail] = useState("priya@taskflow.ai");
  const [password, setPassword] = useState("demo-password-1!");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email);
    setLoading(false);
    if (ok) {
      toast({ title: "Welcome back", description: "You're signed in to Atelier." });
      router.push("/dashboard");
    } else {
      toast({
        title: "No account for that email",
        description: "Try a seed account (priya@taskflow.ai) or sign up.",
        variant: "destructive",
      });
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl tracking-tight">Welcome back.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to continue to your workspace.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="#"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </div>

      <div className="mt-10 rounded-md border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Demo accounts</p>
        <p className="mt-1.5">
          Use any of the seed emails (priya@, marco@, amara@, lin@, sam@taskflow.ai).
          Password isn't checked in this demo build.
        </p>
      </div>
    </div>
  );
}
