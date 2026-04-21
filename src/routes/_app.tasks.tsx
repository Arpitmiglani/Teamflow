import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Clock, Play, Check, Plus } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { fetchTasks, formatDateLabel, type TaskRow } from "@/lib/queries";
import { useRole } from "@/lib/use-role";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Techno Experts" },
      { name: "description", content: "Browse and manage your assigned field tasks." },
    ],
  }),
  component: TasksPage,
});

type FilterKey = "all" | "pending" | "in_progress" | "completed";
const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "Active" },
  { key: "completed", label: "Done" },
];

function TaskCard({ task, onAdvance }: { task: TaskRow; onAdvance: (t: TaskRow) => void }) {
  const statusTone =
    task.status === "completed"
      ? "bg-success/15 text-success"
      : task.status === "in_progress"
        ? "bg-primary/15 text-primary"
        : "bg-warning/20 text-warning-foreground";

  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{task.title}</p>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
          )}
        </div>
        <Badge
          variant={task.priority === "high" ? "destructive" : "secondary"}
          className="shrink-0 text-[10px] capitalize"
        >
          {task.priority}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {formatDateLabel(task.due_date)}
        </span>
        {task.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {task.location}
          </span>
        )}
        <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", statusTone)}>
          {task.status.replace("_", " ")}
        </span>
      </div>
      {task.status !== "completed" && (
        <div className="mt-3 flex justify-end">
          <Button size="sm" variant="outline" onClick={() => onAdvance(task)}>
            {task.status === "pending" ? (
              <><Play className="mr-1.5 h-3.5 w-3.5" /> Start</>
            ) : (
              <><Check className="mr-1.5 h-3.5 w-3.5" /> Complete</>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}

function TasksPage() {
  const { user } = useAuth();
  const { isManagerOrAdmin, loading: roleLoading } = useRole();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const t = await fetchTasks(isManagerOrAdmin ? undefined : user.id);
    setTasks(t);
    setLoading(false);
  };

  useEffect(() => {
    if (roleLoading) return;
    load();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [user, isManagerOrAdmin, roleLoading]);

  const advance = async (task: TaskRow) => {
    const next = task.status === "pending" ? "in_progress" : "completed";
    const { error } = await supabase.from("tasks").update({ status: next }).eq("id", task.id);
    if (error) return toast.error(error.message);
    toast.success(next === "in_progress" ? "Task started" : "Task completed");
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
  };

  const visible = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <>
      <AppHeader
        title={isManagerOrAdmin ? "Task Board" : "My Tasks"}
        subtitle={`${tasks.length} total`}
        right={
          isManagerOrAdmin ? (
            <Button asChild size="sm" variant="secondary" className="h-8 px-2.5">
              <Link to="/tasks/new">
                <Plus className="mr-1 h-4 w-4" /> New
              </Link>
            </Button>
          ) : undefined
        }
      />
      <main className="flex-1 space-y-4 px-4 py-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
          <TabsList className="grid w-full grid-cols-4">
            {filters.map((f) => (
              <TabsTrigger key={f.key} value={f.key} className="text-xs">{f.label}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={filter} className="mt-4 space-y-2.5">
            {loading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
            ) : visible.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No tasks here.</p>
            ) : (
              visible.map((task) => <TaskCard key={task.id} task={task} onAdvance={advance} />)
            )}
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
