"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLocale } from "next-intl";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: { month: string; label: string; revenue: number }[];
}

export function MonthlyRevenueChart({ data }: Props) {
  const locale = useLocale() as "ar" | "en";

  const isEmpty = data.every((d) => d.revenue === 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          reversed={locale === "ar"}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
          orientation={locale === "ar" ? "right" : "left"}
        />
        <Tooltip
          formatter={(value) => [
            formatCurrency(Number(value ?? 0), locale),
            locale === "ar" ? "الإيرادات" : "Revenue",
          ]}
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 12,
          }}
        />
        <Bar
          dataKey="revenue"
          fill="#b8860b"
          radius={[4, 4, 0, 0]}
          label={isEmpty ? false : undefined}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
