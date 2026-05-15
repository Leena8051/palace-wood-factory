import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<string, string> = {
  REQUESTED:   "bg-warning/15 text-warning border-warning/30",
  SCHEDULED:   "bg-info/15 text-info border-info/30",
  IN_PROGRESS: "bg-accent/15 text-accent border-accent/30",
  COMPLETED:   "bg-success/15 text-success border-success/30",
  CANCELLED:   "bg-destructive/15 text-destructive border-destructive/30",
};

interface Props {
  status: string;
  label?: string;
  className?: string;
}

export function MaintenanceStatusBadge({ status, label, className }: Props) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border font-semibold",
        STATUS_CLASSES[status] ?? "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {label ?? status}
    </Badge>
  );
}
