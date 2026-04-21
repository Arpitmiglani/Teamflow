import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, ListChecks, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/use-role";

const items = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/attendance", label: "Attend", icon: Clock },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  const { isManagerOrAdmin } = useRole();
  const visibleItems = isManagerOrAdmin ? items.filter((item) => item.to !== "/attendance") : items;

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
    >
      <ul className={cn("grid", visibleItems.length === 3 ? "grid-cols-3" : "grid-cols-4")}>
        {visibleItems.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110")} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
