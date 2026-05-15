import { Shield, ShieldX, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WarrantyStatus } from "@/lib/warranty";

interface Props {
  warranty: WarrantyStatus | null;
  labels: { active: string; expired: string; notDelivered: string };
}

export function WarrantyBadge({ warranty, labels }: Props) {
  if (!warranty || warranty.reason === "NOT_DELIVERED") {
    return (
      <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground gap-1 text-[10px]">
        <ShieldQuestion className="h-3 w-3" />
        {labels.notDelivered}
      </Badge>
    );
  }
  if (warranty.active) {
    return (
      <Badge variant="outline" className="border-success/30 bg-success/10 text-success gap-1 text-[10px] font-semibold">
        <Shield className="h-3 w-3" />
        {labels.active}
        {warranty.daysRemaining !== null && warranty.daysRemaining <= 90 && (
          <span className="ms-1">({warranty.daysRemaining}d)</span>
        )}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive gap-1 text-[10px]">
      <ShieldX className="h-3 w-3" />
      {labels.expired}
    </Badge>
  );
}
