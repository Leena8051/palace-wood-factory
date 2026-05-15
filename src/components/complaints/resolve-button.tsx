"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveComplaint } from "@/lib/complaints/actions";

interface Props {
  complaintId: string;
}

export function ResolveButton({ complaintId }: Props) {
  const t = useTranslations("complaints.resolve");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!resolution.trim()) {
      toast.error(t("resolutionRequired"));
      return;
    }
    startTransition(async () => {
      const res = await resolveComplaint(complaintId, {
        resolution,
        rating: rating ?? undefined,
      });
      if (res.ok) {
        toast.success(t("resolved"));
        setOpen(false);
        setResolution("");
        setRating(null);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-success hover:bg-success/90 text-success-foreground"
      >
        <CheckCircle2 className="h-4 w-4" />
        {t("resolveButton")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resolution">
                {t("resolution")} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="resolution"
                rows={4}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder={t("resolutionPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("ratingOptional")}</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(rating === n ? null : n)}
                    className={`p-1 rounded transition ${
                      rating !== null && n <= rating
                        ? "text-accent"
                        : "text-muted-foreground hover:text-accent"
                    }`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        rating !== null && n <= rating ? "fill-accent" : ""
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{t("ratingHint")}</p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button onClick={submit} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <CheckCircle2 className="h-4 w-4" />
              {t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
