"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Eraser, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  /** Initial value (data URL) */
  value?: string;
  onChange: (dataUrl: string | null) => void;
  height?: number;
  className?: string;
}

/**
 * Lightweight signature canvas. Captures pointer events
 * (mouse + touch + pen) and emits a PNG data URL on stroke end.
 */
export function SignaturePad({ value, onChange, height = 180, className }: Props) {
  const t = useTranslations("maintenance.signature");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [isEmpty, setIsEmpty] = useState(!value);

  // Resize canvas to its container, preserving DPR
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#2c1810";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      // Restore initial value
      if (value) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, w, h);
        img.src = value;
      }
    }
  }, [height, value]);

  const getPos = (e: PointerEvent | React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDraw = (e: React.PointerEvent) => {
    e.preventDefault();
    drawingRef.current = true;
    lastRef.current = getPos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const pos = getPos(e);
    if (!ctx || !lastRef.current) return;
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastRef.current = pos;
    setIsEmpty(false);
  };

  const endDraw = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);
    if (canvasRef.current) {
      onChange(canvasRef.current.toDataURL("image/png"));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange(null);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <PenTool className="h-3 w-3" />
          {t("hint")}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          <Eraser className="h-3.5 w-3.5" />
          {t("clear")}
        </Button>
      </div>
      <div
        ref={containerRef}
        className="rounded-lg border-2 border-dashed border-border bg-white overflow-hidden"
        style={{ touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={startDraw}
          onPointerMove={move}
          onPointerUp={endDraw}
          onPointerCancel={endDraw}
          onPointerLeave={endDraw}
          className="block w-full cursor-crosshair"
        />
      </div>
      {isEmpty && (
        <p className="text-[10px] text-muted-foreground mt-1">{t("empty")}</p>
      )}
    </div>
  );
}
