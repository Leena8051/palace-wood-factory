"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { toast } from "sonner";
import {
  Upload,
  FileImage,
  FileText,
  Trash2,
  Loader2,
  ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { uploadOrderFiles, deleteOrderFile } from "@/lib/orders/file-actions";

interface FileItem {
  id: string;
  url: string;
  fileType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
}

interface Props {
  orderId: string;
  files: FileItem[];
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function FilesSection({ orderId, files }: Props) {
  const t = useTranslations("orders.files");
  const locale = useLocale() as "ar" | "en";
  const dateLocale = locale === "ar" ? arLocale : undefined;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);

  const onUpload = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const fd = new FormData();
    Array.from(fileList).forEach((f) => fd.append("files", f));
    startTransition(async () => {
      const res = await uploadOrderFiles(orderId, fd);
      if (res.ok) {
        toast.success(t("uploaded", { count: res.data.count }));
      } else {
        toast.error(res.error);
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  const onDelete = (fileId: string, name: string) => {
    if (!confirm(t("confirmDelete", { name }))) return;
    startTransition(async () => {
      const res = await deleteOrderFile(fileId);
      if (res.ok) toast.success(t("deleted"));
      else toast.error(res.error);
    });
  };

  const isImage = (mime: string) => mime.startsWith("image/");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-accent" />
          {t("title")} ({files.length})
        </h3>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onUpload(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? "border-accent bg-accent/5" : "border-border bg-muted/30"
        }`}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">{t("dropHere")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("formats")}</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          className="hidden"
          onChange={(e) => onUpload(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {t("browse")}
        </Button>
      </div>

      {/* File grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {files.map((f) => (
            <div
              key={f.id}
              className="group relative rounded-lg border border-border bg-card overflow-hidden"
            >
              {isImage(f.mimeType) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <a href={f.url} target="_blank" rel="noreferrer">
                  <img
                    src={f.url}
                    alt={f.fileName}
                    className="w-full h-28 object-cover hover:opacity-90"
                  />
                </a>
              ) : (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-28 items-center justify-center bg-muted/50 hover:bg-muted"
                >
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </a>
              )}
              <div className="p-2">
                <p className="text-xs font-medium truncate" title={f.fileName}>
                  {f.fileName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {fmtSize(f.fileSize)} •{" "}
                  {format(f.createdAt, "dd MMM", { locale: dateLocale })}
                </p>
              </div>
              <button
                onClick={() => onDelete(f.id, f.fileName)}
                disabled={isPending}
                className="absolute top-1 end-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-destructive/90 text-destructive-foreground p-1 hover:bg-destructive"
                aria-label={t("delete")}
                title={t("delete")}
              >
                <Trash2 className="h-3 w-3" />
              </button>
              {f.fileType === "DESIGN" && (
                <span className="absolute top-1 start-1 rounded bg-accent/90 text-accent-foreground text-[9px] px-1.5 py-0.5 font-semibold">
                  {t("designLabel")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// silence unused
void FileImage;
