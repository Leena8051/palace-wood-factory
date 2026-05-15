"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Play, CheckCircle2, Ban, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SignaturePad } from "@/components/maintenance/signature-pad";
import {
  startMaintenance,
  completeMaintenance,
  cancelMaintenance,
} from "@/lib/maintenance/actions";

interface Props {
  id: string;
  status: string;
  estimatedCost: number | null;
}

export function MaintenanceActions({ id, status, estimatedCost }: Props) {
  const t = useTranslations("maintenance.actions");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [finalCost, setFinalCost] = useState<string>(
    estimatedCost !== null ? String(estimatedCost) : "",
  );
  const [notes, setNotes] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const onStart = () => {
    startTransition(async () => {
      const res = await startMaintenance(id);
      if (res.ok) toast.success(t("started"));
      else toast.error(res.error);
    });
  };

  const onComplete = () => {
    if (!signature) {
      toast.error(t("signatureRequired"));
      return;
    }
    startTransition(async () => {
      const res = await completeMaintenance(id, {
        finalCost: finalCost ? Number(finalCost) : undefined,
        customerSignature: signature,
        notes,
      });
      if (res.ok) {
        toast.success(t("completed"));
        setCompleteOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  const onCancel = () => {
    if (!cancelReason.trim()) {
      toast.error(t("cancelReasonRequired"));
      return;
    }
    startTransition(async () => {
      const res = await cancelMaintenance(id, cancelReason);
      if (res.ok) {
        toast.success(t("cancelled"));
        setCancelOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  if (status === "COMPLETED") {
    return (
      <div className="rounded-lg bg-success/10 border border-success/30 p-3 text-sm text-success text-center font-medium">
        ✓ {t("alreadyCompleted")}
      </div>
    );
  }
  if (status === "CANCELLED") {
    return (
      <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive text-center">
        {t("alreadyCancelled")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(status === "REQUESTED" || status === "SCHEDULED") && (
          <Button
            onClick={onStart}
            disabled={isPending}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {t("start")}
          </Button>
        )}
        {status === "IN_PROGRESS" && (
          <Button
            onClick={() => setCompleteOpen(true)}
            disabled={isPending}
            className="bg-success hover:bg-success/90 text-success-foreground"
          >
            <CheckCircle2 className="h-4 w-4" />
            {t("complete")}
          </Button>
        )}
        <Button
          onClick={() => setCancelOpen(true)}
          variant="outline"
          className="text-destructive border-destructive/40"
          disabled={isPending}
        >
          <Ban className="h-4 w-4" />
          {t("cancel")}
        </Button>
      </div>

      {/* Complete dialog (with signature) */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent
          onClose={() => setCompleteOpen(false)}
          className="max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>{t("completeTitle")}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="finalCost">{t("finalCost")}</Label>
              <Input
                id="finalCost"
                type="number"
                step="0.01"
                dir="ltr"
                value={finalCost}
                onChange={(e) => setFinalCost(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completeNotes">{t("notes")}</Label>
              <Textarea
                id="completeNotes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {t("customerSignature")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <SignaturePad
                value={signature ?? undefined}
                onChange={setSignature}
                height={150}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCompleteOpen(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button onClick={onComplete} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <CheckCircle2 className="h-4 w-4" />
              {t("confirmComplete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent onClose={() => setCancelOpen(false)}>
          <DialogHeader>
            <DialogTitle>{t("cancelTitle")}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-2">
              <Label htmlFor="cancelReason">
                {t("cancelReason")} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="cancelReason"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={onCancel}
              disabled={isPending}
              variant="destructive"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("confirmCancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
