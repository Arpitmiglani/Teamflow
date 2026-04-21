import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchUserRole } from "@/lib/queries";

export type Role = "admin" | "manager" | "employee";

export function useRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    if (!user) { setRole(null); return; }
    let cancelled = false;
    fetchUserRole(user.id).then((r) => { if (!cancelled) setRole(r); });
    return () => { cancelled = true; };
  }, [user]);

  return {
    role,
    loading: role === null,
    isManagerOrAdmin: role === "admin" || role === "manager",
    isAdmin: role === "admin",
  };
}
