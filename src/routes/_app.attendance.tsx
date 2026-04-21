import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, MapPin, LogIn, LogOut } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useRole } from "@/lib/use-role";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAttendance,
  formatDateLabel,
  formatTime,
  type AttendanceRow,
} from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — Techno Experts" },
      { name: "description", content: "Check in and out and review your attendance." },
    ],
  }),
  component: AttendancePage,
});

function getLocation(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(`${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`),
      () => resolve(null),
      { timeout: 4000 },
    );
  });
}

function AttendancePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isManagerOrAdmin, loading: roleLoading } = useRole();
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const r = await fetchAttendance(user.id);
    setRecords(r);
    setLoading(false);
  };

  useEffect(() => {
    if (!roleLoading && isManagerOrAdmin) {
      navigate({ to: "/dashboard" });
      return;
    }
    load();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [user, roleLoading, isManagerOrAdmin, navigate]);

  if (isManagerOrAdmin) {
    return null;
  }

  const open = records.find((r) => !r.check_out) ?? null;
  const checkedIn = !!open;

  const triggerWebhook = (payload: Record<string, unknown>) => {
    const webhookUrl = localStorage.getItem("n8n_webhook")?.trim();
    if (!webhookUrl) return;

    void fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Keep attendance flow resilient even when webhook endpoint is unavailable.
    });
  };

  const handleToggle = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const location = await getLocation();
      if (open) {
        const checkOut = new Date();
        const inMs = new Date(open.check_in).getTime();
        const hours = Math.round(((checkOut.getTime() - inMs) / 36e5) * 100) / 100;
        const { error } = await supabase
          .from("attendance")
          .update({ check_out: checkOut.toISOString(), hours })
          .eq("id", open.id);
        if (error) throw error;
        triggerWebhook({
          event: "attendance_checked_out",
          userId: user.id,
          checkOut: checkOut.toISOString(),
          hours,
          location,
        });
        toast.success("Checked out", { description: `${hours.toFixed(1)}h logged.` });
      } else {
        const checkIn = new Date().toISOString();
        const { error } = await supabase.from("attendance").insert({
          user_id: user.id,
          check_in: checkIn,
          location,
        });
        if (error) throw error;
        triggerWebhook({
          event: "attendance_checked_in",
          userId: user.id,
          checkIn,
          location,
        });
        toast.success("Checked in", { description: location ? `Location: ${location}` : "No location." });
      }
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AppHeader title="Attendance" subtitle="Today" />
      <main className="flex-1 space-y-5 px-4 py-5">
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
              <p className="mt-1 text-lg font-semibold">
                {checkedIn ? "On the clock" : "Not checked in"}
              </p>
            </div>
            <span
              className={
                checkedIn
                  ? "rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success"
                  : "rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
              }
            >
              {checkedIn ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted/60 p-3">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Check-in
              </p>
              <p className="mt-1 font-semibold">{open ? formatTime(open.check_in) : "—"}</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-3">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Location
              </p>
              <p className="mt-1 truncate font-semibold">{open?.location ?? "—"}</p>
            </div>
          </div>

          <Button
            onClick={handleToggle}
            className="w-full"
            variant={checkedIn ? "destructive" : "default"}
            size="lg"
            disabled={busy}
          >
            {checkedIn ? (
              <><LogOut className="mr-2 h-4 w-4" /> {busy ? "Checking out…" : "Check out"}</>
            ) : (
              <><LogIn className="mr-2 h-4 w-4" /> {busy ? "Checking in…" : "Check in"}</>
            )}
          </Button>
        </Card>

        <section aria-labelledby="history-heading" className="space-y-2.5">
          <h2 id="history-heading" className="text-sm font-semibold">
            Recent history
          </h2>
          {loading ? (
            <Card className="p-4 text-center text-xs text-muted-foreground">Loading…</Card>
          ) : records.length === 0 ? (
            <Card className="p-4 text-center text-xs text-muted-foreground">
              No attendance records yet.
            </Card>
          ) : (
            records.map((rec) => (
              <Card key={rec.id} className="flex items-center justify-between p-3.5">
                <div>
                  <p className="text-sm font-medium">{formatDateLabel(rec.check_in)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatTime(rec.check_in)} → {formatTime(rec.check_out)}
                    {rec.location ? ` · ${rec.location}` : ""}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-primary">
                  {rec.hours ? `${Number(rec.hours).toFixed(1)}h` : "—"}
                </span>
              </Card>
            ))
          )}
        </section>
      </main>
    </>
  );
}
