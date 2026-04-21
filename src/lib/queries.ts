import { supabase } from "@/integrations/supabase/client";

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  assignee_id: string | null;
  due_date: string | null;
  location: string | null;
  created_at: string;
};

export type AttendanceRow = {
  id: string;
  user_id: string;
  check_in: string;
  check_out: string | null;
  location: string | null;
  hours: number | null;
};

export type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_initials: string | null;
};

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, avatar_initials")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

export async function fetchUserRole(userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw error;
  const roles = (data ?? []).map((r) => r.role);
  if (roles.includes("admin")) return "admin" as const;
  if (roles.includes("manager")) return "manager" as const;
  return "employee" as const;
}

export async function fetchTasks(userId?: string) {
  let query = supabase
    .from("tasks")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (userId) {
    query = query.eq("assignee_id", userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TaskRow[];
}

export async function fetchAttendance(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", userId)
    .order("check_in", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AttendanceRow[];
}

export async function fetchAssignableUsers() {
  // Visible to managers/admins via RLS policy on profiles.
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as { id: string; full_name: string; phone: string | null }[];
}

export function formatDateLabel(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, yest)) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
