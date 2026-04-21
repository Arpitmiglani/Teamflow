import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ListChecks, Clock, CheckCircle2, AlertCircle, ChevronRight, Plus } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import {
  fetchProfile,
  fetchTasks,
  fetchUserRole,
  formatDateLabel,
  type ProfileRow,
  type TaskRow,
} from "@/lib/queries";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Techno Experts" },
      { name: "description", content: "Your daily overview of tasks and attendance." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [role, setRole] = useState<"admin" | "manager" | "employee">("employee");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [p, r] = await Promise.all([fetchProfile(user.id), fetchUserRole(user.id)]);
      const t = await fetchTasks(r === "employee" ? user.id : undefined);
      if (cancelled) return;
      setTasks(t);
      setProfile(p);
      setRole(r);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const pending = tasks.filter((t) => t.status === "pending").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const todays = role === "employee"
    ? tasks.filter((t) => t.status !== "completed").slice(0, 3)
    : tasks.filter((t) => t.status === "in_progress").slice(0, 3);

  const stats = [
    { label: "Pending", value: pending, icon: AlertCircle, tone: "warning" as const },
    { label: role === "employee" ? "Active" : "Going on", value: inProgress, icon: Clock, tone: "primary" as const },
    { label: role === "employee" ? "Done" : "Completed", value: completed, icon: CheckCircle2, tone: "success" as const },
  ];

  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <>
      <AppHeader title={`Hi, ${firstName}`} subtitle={roleLabel} />

      <main className="flex-1 space-y-5 px-4 py-5">
        <section aria-label="Summary" className="grid grid-cols-3 gap-3">
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <Card key={label} className="flex flex-col items-start gap-2 p-3">
              <div
                className={
                  tone === "primary"
                    ? "flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
                    : tone === "success"
                      ? "flex h-8 w-8 items-center justify-center rounded-lg bg-success/15 text-success"
                      : "flex h-8 w-8 items-center justify-center rounded-lg bg-warning/20 text-warning-foreground"
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            </Card>
          ))}
        </section>

        <section aria-labelledby="today-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="today-heading" className="text-sm font-semibold">
              {role === "employee" ? "Today's tasks" : "Tasks going on"}
            </h2>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-0.5 text-xs font-medium text-primary"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <Card className="p-4 text-center text-xs text-muted-foreground">Loading…</Card>
            ) : todays.length === 0 ? (
              <Card className="p-4 text-center text-xs text-muted-foreground">
                {role === "employee" ? "No tasks assigned yet." : "No ongoing tasks right now."}
              </Card>
            ) : (
              todays.map((task) => (
                <Card key={task.id} className="p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateLabel(task.due_date)}
                      </p>
                    </div>
                    <Badge
                      variant={task.priority === "high" ? "destructive" : "secondary"}
                      className="shrink-0 text-[10px]"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>

        <section aria-label="Quick links" className="grid grid-cols-2 gap-3">
          {role === "employee" ? (
            <>
              <Link to="/tasks" className="block">
                <Card className="flex items-center gap-3 p-3.5 transition-colors hover:bg-accent/40">
                  <ListChecks className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-sm font-medium">My Tasks</span>
                </Card>
              </Link>
              <Link to="/attendance" className="block">
                <Card className="flex items-center gap-3 p-3.5 transition-colors hover:bg-accent/40">
                  <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-sm font-medium">Attendance</span>
                </Card>
              </Link>
            </>
          ) : (
            <>
              <Link to="/tasks/new" className="block">
                <Card className="flex items-center gap-3 p-3.5 transition-colors hover:bg-accent/40">
                  <Plus className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-sm font-medium">Add New Task</span>
                </Card>
              </Link>
              <Link to="/tasks" className="block">
                <Card className="flex items-center gap-3 p-3.5 transition-colors hover:bg-accent/40">
                  <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-sm font-medium">Completed Tasks</span>
                </Card>
              </Link>
            </>
          )}
        </section>
      </main>
    </>
  );
}
