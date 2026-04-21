import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { useRole } from "@/lib/use-role";
import { fetchAssignableUsers } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tasks_/new")({
  head: () => ({
    meta: [
      { title: "New task — Techno Experts" },
      { name: "description", content: "Create and assign a task to an employee." },
    ],
  }),
  component: NewTaskPage,
});

function NewTaskPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, loading: roleLoading, isManagerOrAdmin } = useRole();

  const [users, setUsers] = useState<{ id: string; full_name: string; phone: string | null }[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isManagerOrAdmin) return;
    fetchAssignableUsers()
      .then(setUsers)
      .catch((e) => toast.error(e.message));
  }, [isManagerOrAdmin]);

  if (roleLoading) {
    return (
      <>
        <AppHeader title="New task" />
        <main className="flex-1 px-4 py-10 text-center text-sm text-muted-foreground">
          Loading…
        </main>
      </>
    );
  }

  if (!isManagerOrAdmin) {
    return (
      <>
        <AppHeader title="New task" />
        <main className="flex-1 space-y-4 px-4 py-8">
          <Card className="p-5 text-center">
            <p className="text-sm font-semibold">Manager access required</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your role ({role}) cannot create tasks. Ask an admin to upgrade your role.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/tasks" })}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to tasks
            </Button>
          </Card>
        </main>
      </>
    );
  }

  const triggerWebhook = (payload: Record<string, unknown>) => {
    const webhookUrl = localStorage.getItem("n8n_webhook")?.trim();
    if (!webhookUrl) return;

    void fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Keep task creation resilient even when webhook endpoint is unavailable.
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !assigneeId) {
      toast.error("Title and assignee are required");
      return;
    }
    setSaving(true);
    const dueDateIso = dueDate
      ? new Date(`${dueDate}T${dueTime || "00:00"}`).toISOString()
      : null;
    const { error } = await supabase.from("tasks").insert({
      title: title.trim(),
      description: description.trim() || null,
      assignee_id: assigneeId,
      created_by: user.id,
      priority,
      due_date: dueDateIso,
      location: location.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    const assignee = users.find((u) => u.id === assigneeId);
    triggerWebhook({
      event: "task_created",
      taskTitle: title.trim(),
      employeeName: assignee?.full_name || "Employee",
      employeePhone: assignee?.phone ?? null,
    });
    toast.success("Task created");
    navigate({ to: "/tasks" });
  };

  const setQuickDueDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setDueDate(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <>
      <AppHeader title="New task" subtitle="Assign to an employee" />
      <main className="flex-1 space-y-4 px-4 py-5">
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="AC unit installation — Villa 12"
                required
                maxLength={200}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details, parts needed, contact info…"
                rows={3}
                maxLength={1000}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assignee">Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {users.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No employees available
                    </SelectItem>
                  ) : (
                    users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || "Unnamed user"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="due-date">Due date (optional)</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1 min-w-[92px]" onClick={() => setQuickDueDate(0)}>
                    Today
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="flex-1 min-w-[92px]" onClick={() => setQuickDueDate(1)}>
                    Tomorrow
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="flex-1 min-w-[92px]" onClick={() => { setDueDate(""); setDueTime(""); }}>
                    Clear
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="due-time">Due time (optional)</Label>
                <Input
                  id="due-time"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="New Cairo, Compound A"
                maxLength={200}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate({ to: "/tasks" })}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving…" : "Create task"}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </>
  );
}
