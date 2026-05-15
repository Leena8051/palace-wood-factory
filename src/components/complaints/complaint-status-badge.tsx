import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<string, string> = {
  OPEN:        "bg-warning/15 text-warning border-warning/30",
  IN_PROGRESS: "bg-info/15 text-info border-info/30",
  RESOLVED:    "bg-success/15 text-success border-success/30",
  CLOSED:      "bg-muted text-muted-foreground border-border",
};

interface Props {
  status: string;
  label?: string;
  className?: string;
}

export function ComplaintStatusBadge({ status, label, className }: Props) {
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
