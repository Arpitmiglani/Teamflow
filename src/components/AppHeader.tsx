interface AppHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function AppHeader({ title, subtitle, right }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
          <span className="text-sm font-black tracking-[-0.08em]">TC</span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight">{title}</h1>
          {subtitle && (
            <p className="truncate text-xs text-primary-foreground/80">{subtitle}</p>
          )}
        </div>
        {right}
      </div>
    </header>
  );
}
