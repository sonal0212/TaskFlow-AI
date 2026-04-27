"use client";

import { useState } from "react";
import { Topbar } from "@/components/app/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const me = useStore((s) => s.currentUser());
  const ws = useStore((s) => s.workspaces[0]);
  const memberships = useStore((s) => s.memberships);
  const users = useStore((s) => s.users);
  const { toast } = useToast();

  const [name, setName] = useState(me?.displayName ?? "");
  const [email, setEmail] = useState(me?.email ?? "");
  const [tz, setTz] = useState(ws?.timezone ?? "UTC");

  return (
    <>
      <Topbar title="Settings" />
      <main className="container max-w-3xl space-y-8 py-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            Workspace & profile
          </p>
          <h2 className="font-display mt-2 text-4xl tracking-tight">Settings</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>How you appear to your collaborators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <UserAvatar name={name || me?.displayName || "?"} size="lg" />
              <div className="text-sm text-muted-foreground">
                Avatar derived from your initials. Custom uploads land in v1.1.
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <Button
                onClick={() =>
                  toast({ title: "Profile saved", variant: "success" })
                }
              >
                Save profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>
              Default timezone is used by AI features for date resolution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Workspace name</Label>
                <Input defaultValue={ws?.name} />
              </div>
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Select value={tz} onValueChange={setTz}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "UTC",
                      "Europe/London",
                      "Europe/Paris",
                      "America/New_York",
                      "America/Los_Angeles",
                      "Asia/Tokyo",
                      "Asia/Singapore",
                      "Asia/Kolkata",
                    ].map((z) => (
                      <SelectItem key={z} value={z}>
                        {z}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Button
                onClick={() =>
                  toast({ title: "Workspace updated", variant: "success" })
                }
              >
                Save workspace
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              {memberships.length} people in this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {memberships.map((m) => {
              const u = users.find((x) => x.id === m.userId);
              if (!u) return null;
              return (
                <div
                  key={m.userId}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-secondary/40"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar name={u.displayName} size="sm" />
                    <div>
                      <div className="text-sm font-medium">{u.displayName}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </div>
                  <Badge variant={m.role === "OWNER" ? "primary" : "outline"}>
                    {m.role.toLowerCase()}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Danger zone</CardTitle>
            <CardDescription>
              Archiving locks the workspace; deletion is permanent after 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline">Archive workspace</Button>
            <Button variant="destructive">Delete workspace</Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
