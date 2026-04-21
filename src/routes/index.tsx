import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, User as UserIcon, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Techno Experts" },
      { name: "description", content: "Sign in or create an account for Techno Experts." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && session) navigate({ to: "/dashboard" });
  }, [session, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }

    setLoading(true);
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);

    if (error) return toast.error(error.message);
    toast.success("Password reset email sent", {
      description: "Check your inbox and follow the link to reset your password.",
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName, phone },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Verification email sent", {
      description: "Verify your email, then sign in to continue.",
    });
    setTab("signin");
    setPassword("");
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-gradient-to-b from-[#4CB0EA] via-[#46A9E4] to-[#3F9FD9] text-[#0A1020]">
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-12">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/35">
            <BrandMark />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Techno Experts</h1>
          <p className="mt-1 text-sm text-[#0A1020]/80">
            Workforce management, simplified.
          </p>
        </div>

        <Card className="w-full p-5 text-foreground">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <Field id="email" label="Email" icon={Mail} type="email" autoComplete="email" value={email} onChange={setEmail} required />
                <Field id="password" label="Password" icon={Lock} type="password" autoComplete="current-password" value={password} onChange={setPassword} required />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
                <Button type="button" variant="link" className="h-auto w-full p-0 text-sm" disabled={loading} onClick={handleForgotPassword}>
                  Forgot password?
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <Field id="su-name" label="Full name" icon={UserIcon} value={fullName} onChange={setFullName} required />
                <Field id="su-phone" label="Phone" icon={Phone} type="tel" value={phone} onChange={setPhone} />
                <Field id="su-email" label="Email" icon={Mail} type="email" autoComplete="email" value={email} onChange={setEmail} required />
                <Field id="su-password" label="Password" icon={Lock} type="password" autoComplete="new-password" value={password} onChange={setPassword} required />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <p className="pointer-events-none select-none px-6 pb-6 pt-8 text-center text-xs font-medium tracking-wide text-[#0A1020]/55">
        Techno Experts
      </p>
    </div>
  );
}

function BrandMark() {
  return <span className="text-[1.55rem] font-black leading-none tracking-[-0.08em] text-[#0A1020]">TE</span>;
}

function Field({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          id={id}
          type={type}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
