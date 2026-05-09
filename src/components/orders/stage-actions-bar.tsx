"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Play,
  Check,
  Ban,
  Loader2,
  PackageCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  startStage,
  completeStage,
  blockStage,
  markDelivered,
} from "@/lib/orders/stage-actions";

interface Stage {
  id: string;
  stageNumber: number;
  stageName: string;
  status: string;
}

interface Props {
  orderId: string;
  orderStatus: string;
  stages: Stage[];
  currentStage: number;
}

export function StageActionsBar({
  orderId,
  orderStatus,
  stages,
  currentStage,
}: Props) {
  const t = useTranslations("orders.stageActions");
  const tStages = useTranslations("orders.stages");
  const [isPending, startTransition] = useTransition();
  const [completeDialog, setCompleteDialog] = useState<Stage | null>(null);
  const [blockDialog, setBlockDialog] = useState<Stage | null>(null);
  const [completeNotes, setCompleteNotes] = useState("");
  const [blockReason, setBlockReason] = useState("");

  if (orderStatus === "CANCELLED") {
    return (
      <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive text-center">
        {t("cancelledHint")}
      </div>
    );
  }

  const stage5 = stages.find((s) => s.stageNumber === 5);
  const allCompleted = stages.every((s) => s.status === "COMPLETED");
  const current = stages.find((s) => s.stageNumber === currentStage);

  const onStart = (s: Stage) => {
    startTransition(async () => {
      const res = await startStage(orderId, s.stageNumber);
      if (res.ok) toast.success(t("started", { stage: tStages(s.stageName) }));
      else toast.error(res.error);
    });
  };

  const onComplete = () => {
    if (!completeDialog) return;
    const stage = completeDialog;
    const notes = completeNotes;
    startTransition(async () => {
      const res = await completeStage(orderId, stage.stageNumber, notes);
      if (res.ok) {
        toast.success(t("completed", { stage: tStages(stage.stageName) }));
        setCompleteDialog(null);
        setCompleteNotes("");
      } else toast.error(res.error);
    });
  };

  const onBlock = () => {
    if (!blockDialog) return;
    const stage = blockDialog;
    const reason = blockReason;
    if (!reason.trim()) {
      toast.error(t("blockReasonRequired"));
      return;
    }
    startTransition(async () => {
      const res = await blockStage(orderId, stage.stageNumber, reason);
      if (res.ok) {
        toast.success(t("blocked"));
        setBlockDialog(null);
        setBlockReason("");
      } else toast.error(res.error);
    });
  };

  const onDeliver = () => {
    startTransition(async () => {
      const res = await markDelivered(orderId);
      if (res.ok) toast.success(t("delivered"));
      else toast.error(res.error);
    });
  };

  return (
    <div className="space-y-3">
      {/* Mark delivered when stage 5 complete */}
      {allCompleted && orderStatus !== "DELIVERED" && (
        <Button
          onClick={onDeliver}
          disabled={isPending}
          variant="accent"
          className="w-full"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
          {t("markDelivered")}
        </Button>
      )}

      {orderStatus === "DELIVERED" && (
        <div className="rounded-lg bg-success/10 p-3 text-sm text-success text-center font-medium">
          ✓ {t("alreadyDelivered")}
        </div>
      )}

      {!allCompleted && current && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Start (only for PENDING / BLOCKED) */}
          {current.status !== "IN_PROGRESS" && current.status !== "COMPLETED" && (
            <Button
              onClick={() => onStart(current)}
              disabled={isPending}
              variant="default"
            >
              <Play className="h-4 w-4" />
              {t("start", { stage: tStages(current.stageName) })}
            </Button>
          )}

          {/* Complete (only for IN_PROGRESS) */}
          {current.status === "IN_PROGRESS" && (
            <Button
              onClick={() => setCompleteDialog(current)}
              disabled={isPending}
              variant="default"
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              <Check className="h-4 w-4" />
              {t("complete", { stage: tStages(current.stageName) })}
            </Button>
          )}

          {/* Block */}
          {current.status !== "BLOCKED" && current.status !== "COMPLETED" && (
            <Button
              onClick={() => setBlockDialog(current)}
              disabled={isPending}
              variant="outline"
              className="text-destructive border-destructive/40"
            >
              <Ban className="h-4 w-4" />
              {t("block")}
            </Button>
          )}

          {/* Show next stage start button if current is COMPLETED but next not started yet */}
          {current.status === "COMPLETED" && stage5 && currentStage < 5 && (
            <p className="text-xs text-muted-foreground sm:col-span-3 text-center">
              {t("nextStageHint")}
            </p>
          )}
        </div>
      )}

      {/* Complete dialog */}
      <Dialog
        open={!!completeDialog}
        onOpenChange={(o) => !o && setCompleteDialog(null)}
      >
        <DialogContent onClose={() => setCompleteDialog(null)}>
          <DialogHeader>
            <DialogTitle>
              {t("complete", {
                stage: completeDialog ? tStages(completeDialog.stageName) : "",
              })}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-2">
              <Label htmlFor="completeNotes">{t("notesOptional")}</Label>
              <Textarea
                id="completeNotes"
                rows={3}
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompleteDialog(null)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button onClick={onComplete} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Check className="h-4 w-4" />
              {t("confirmComplete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block dialog */}
      <Dialog
        open={!!blockDialog}
        onOpenChange={(o) => !o && setBlockDialog(null)}
      >
        <DialogContent onClose={() => setBlockDialog(null)}>
          <DialogHeader>
            <DialogTitle>
              {t("blockTitle", {
                stage: blockDialog ? tStages(blockDialog.stageName) : "",
              })}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-2">
              <Label htmlFor="blockReason">
                {t("blockReason")} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="blockReason"
                rows={3}
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder={t("blockReasonPlaceholder")}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBlockDialog(null)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={onBlock}
              disabled={isPending}
              variant="destructive"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Ban className="h-4 w-4" />
              {t("confirmBlock")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
