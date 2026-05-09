import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpRight, Flame } from "lucide-react";

const PRIORITY_CONFIG: Record<
  string,
  { className: string; icon: typeof Flame }
> = {
  LOW:    { className: "bg-muted text-muted-foreground", icon: ArrowDown },
  NORMAL: { className: "bg-secondary text-secondary-foreground", icon: ArrowUpRight },
  HIGH:   { className: "bg-warning/15 text-warning border-warning/30", icon: ArrowUp },
  URGENT: { className: "bg-destructive/15 text-destructive border-destructive/30", icon: Flame },
};

interface Props {
  priority: string;
  label?: string;
  className?: string;
  showIcon?: boolean;
}

export function OrderPriorityBadge({
  priority,
  label,
  className,
  showIcon = true,
}: Props) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.NORMAL;
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={cn("border gap-1 font-semibold", cfg.className, className)}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {label ?? priority}
    </Badge>
  );
}
