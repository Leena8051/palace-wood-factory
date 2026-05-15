"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLocale } from "next-intl";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: { month: string; label: string; revenue: number; orders: number }[];
}

export function RevenueAreaChart({ data }: Props) {
  const locale = useLocale() as "ar" | "en";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#b8860b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#b8860b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          reversed={locale === "ar"}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(v) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
          orientation={locale === "ar" ? "right" : "left"}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0]?.payload as Props["data"][number];
            return (
              <div
                className="rounded-lg border border-border bg-card shadow-lg px-3 py-2 text-xs space-y-1"
                style={{ minWidth: 140 }}
              >
                <p className="font-semibold text-foreground">{label}</p>
                <p className="text-accent">
                  {formatCurrency(d.revenue, locale)}
                </p>
                <p className="text-muted-foreground">
                  {d.orders} {locale === "ar" ? "طلب" : "orders"}
                </p>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#b8860b"
          strokeWidth={2.5}
          fill="url(#revenueGradient)"
          dot={{ r: 4, fill: "#b8860b", strokeWidth: 2, stroke: "hsl(var(--card))" }}
          activeDot={{ r: 6, fill: "#b8860b" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
