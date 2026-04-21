
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Bell, MapPin, Webhook, Moon, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { fetchProfile, fetchUserRole, type ProfileRow } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Techno Experts" },
      { name: "description", content: "Manage your profile, automation and preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [role, setRole] = useState<"admin" | "manager" | "employee">("employee");
  const [webhook, setWebhook] = useState("");
  const [managerIdentifier, setManagerIdentifier] = useState("");
  const [authorizing, setAuthorizing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [geo, setGeo] = useState(true);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchProfile(user.id), fetchUserRole(user.id)]).then(([p, r]) => {
      setProfile(p);
      setRole(r);
    });
    setWebhook(localStorage.getItem("n8n_webhook") ?? "");
  }, [user]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode");
    const isDark = savedTheme
      ? savedTheme === "dark"
      : document.documentElement.classList.contains("dark");
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
    localStorage.setItem("theme_mode", v ? "dark" : "light");
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  const handleAuthorizeManager = async () => {
    const identifier = managerIdentifier.trim();
    if (!identifier) {
      toast.error("Enter user email or ID");
      return;
    }

    setAuthorizing(true);
    const { error } = await supabase.rpc("grant_manager_access", {
      target_identifier: identifier,
    });
    setAuthorizing(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Manager access granted");
    setManagerIdentifier("");
  };

  const initials =
    profile?.avatar_initials ||
    (profile?.full_name || user?.email || "?").slice(0, 2).toUpperCase();

  return (
    <>
      <AppHeader title="Settings" subtitle="Profile & preferences" />
      <main className="flex-1 space-y-5 px-4 py-5">
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-base font-semibold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{profile?.full_name || "—"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            {profile?.phone && (
              <p className="truncate text-xs text-muted-foreground">{profile.phone}</p>
            )}
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {role}
          </span>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Webhook className="h-4 w-4 text-primary" aria-hidden="true" /> n8n webhook
          </h2>
          <Label htmlFor="webhook" className="text-xs text-muted-foreground">
            Outbound URL for task & attendance events
          </Label>
          <Input
            id="webhook"
            type="url"
            placeholder="https://n8n.your-domain.com/webhook/..."
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
            className="mt-1.5"
          />
          <Button
            size="sm"
            className="mt-3 w-full"
            onClick={() => {
              localStorage.setItem("n8n_webhook", webhook);
              toast.success("Webhook saved");
            }}
          >
            Save webhook
          </Button>
        </Card>

        {(role === "admin" || role === "manager") && (
          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" /> Access control
            </h2>
            <Label htmlFor="manager-id" className="text-xs text-muted-foreground">
              Grant manager screen access by email or user ID
            </Label>
            <Input
              id="manager-id"
              placeholder="user@email.com or user uuid"
              value={managerIdentifier}
              onChange={(e) => setManagerIdentifier(e.target.value)}
              className="mt-1.5"
            />
            <Button
              size="sm"
              className="mt-3 w-full"
              disabled={authorizing}
              onClick={handleAuthorizeManager}
            >
              {authorizing ? "Authorizing…" : "Authorize manager access"}
            </Button>
          </Card>
        )}

        <Card className="divide-y divide-border p-0">
          <Row icon={Bell} label="Push notifications">
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </Row>
          <Row icon={MapPin} label="Geolocation on attendance">
            <Switch checked={geo} onCheckedChange={setGeo} />
          </Row>
          <Row icon={Moon} label="Dark mode">
            <Switch checked={dark} onCheckedChange={toggleDark} />
          </Row>
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" /> About
          </h2>
          <p className="text-xs text-muted-foreground">
            Techno Experts · v0.1.0
          </p>
        </Card>

        <Separator />

        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </main>
    </>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="flex items-center gap-3 text-sm">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
        {label}
      </span>
      {children}
    </div>
  );
}
