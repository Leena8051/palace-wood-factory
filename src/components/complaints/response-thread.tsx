"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2, Send, Lock, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { addComplaintResponse } from "@/lib/complaints/actions";
import { cn } from "@/lib/utils";

interface ResponseItem {
  id: string;
  message: string;
  isInternal: boolean;
  createdAt: Date;
  author: { id: string; name: string; role: string };
}

interface Props {
  complaintId: string;
  responses: ResponseItem[];
  canRespond: boolean;
}

export function ResponseThread({ complaintId, responses, canRespond }: Props) {
  const t = useTranslations("complaints.thread");
  const locale = useLocale() as "ar" | "en";
  const dateLocale = locale === "ar" ? arLocale : undefined;
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!message.trim()) return;
    startTransition(async () => {
      const res = await addComplaintResponse(complaintId, {
        message,
        isInternal,
      });
      if (res.ok) {
        toast.success(t("sent"));
        setMessage("");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-accent" />
        {t("title")} ({responses.length})
      </h3>

      {responses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          {t("empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {responses.map((r) => (
            <div
              key={r.id}
              className={cn(
                "rounded-lg border p-3 space-y-2",
                r.isInternal
                  ? "bg-warning/5 border-warning/30"
                  : "bg-card border-border",
              )}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.author.name}</span>
                  <span className="text-muted-foreground">• {r.author.role}</span>
                  {r.isInternal && (
                    <span className="inline-flex items-center gap-1 text-warning">
                      <Lock className="h-3 w-3" />
                      {t("internalLabel")}
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground">
                  {format(r.createdAt, "dd MMM yyyy HH:mm", { locale: dateLocale })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {r.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {canRespond && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          <Label htmlFor="message" className="font-semibold">
            {t("addResponse")}
          </Label>
          <Textarea
            id="message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("placeholder")}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="internal"
                checked={isInternal}
                onCheckedChange={setIsInternal}
              />
              <Label htmlFor="internal" className="cursor-pointer text-xs">
                <Lock className="inline h-3 w-3 me-1" />
                {t("internalToggle")}
              </Label>
            </div>
            <Button onClick={submit} disabled={isPending || !message.trim()}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t("send")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
