import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error || !data.session) {
        toast.error("Verification failed", {
          description: "Please try signing in again.",
        });
        navigate({ to: "/" });
        return;
      }

      toast.success("Email verified", {
        description: "Your account is ready.",
      });
      navigate({ to: "/dashboard" });
    };

    void handleAuthCallback();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center bg-background px-6 text-center">
      <p className="text-sm text-muted-foreground">Verifying your email, please wait…</p>
    </div>
  );
}
