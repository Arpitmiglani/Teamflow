import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [session, loading, navigate]);

  if (loading || !session) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-20">
      <Outlet />
      <div className="pointer-events-none fixed bottom-[4.6rem] left-1/2 z-30 -translate-x-1/2 select-none text-[11px] font-medium tracking-wide text-muted-foreground/55">
        Techno Experts
      </div>
      <BottomNav />
    </div>
  );
}
