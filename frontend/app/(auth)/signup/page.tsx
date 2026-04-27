"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/toast";

export default function SignupPage() {
  const router = useRouter();
  const signup = useStore((s) => s.signup);
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function passwordStrong(p: string) {
    // mirrors FR-1.1 validation
    return p.length >= 10 && /[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordStrong(password)) {
      toast({
        title: "Choose a stronger password",
        description: "≥ 10 chars, including an upper, a digit, and a symbol.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await signup({ email, displayName: name });
      toast({ title: "Workspace ready", description: "Welcome to TaskFlow AI." });
      router.push("/dashboard");
    } catch (err) {
      toast({
        title: "Sign up failed",
        description: err instanceof Error ? err.message : "Could not create account.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl tracking-tight">Start your workspace.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Free for solo makers. 1 workspace, 3 collaborators, 100 tasks.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={60}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            ≥ 10 characters, with an uppercase, a digit, and a symbol.
          </p>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating workspace…" : "Create account"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By signing up you agree to the Terms and acknowledge the Privacy Policy.
        </p>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
