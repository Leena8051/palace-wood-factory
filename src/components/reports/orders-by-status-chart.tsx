"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useTranslations, useLocale } from "next-intl";

const STATUS_COLORS: Record<string, string> = {
  NEW:        "#94a3b8",
  DESIGN:     "#b8860b",
  APPROVED:   "#d4a017",
  PRODUCTION: "#2c7a7b",
  FINISHING:  "#2c1810",
  READY:      "#15803d",
  DELIVERED:  "#166534",
  CANCELLED:  "#991b1b",
};

interface Props {
  data: { status: string; count: number }[];
}

export function OrdersByStatusChart({ data }: Props) {
  const tStatus = useTranslations("orders.statuses");
  const locale = useLocale() as "ar" | "en";

  const chartData = data.map((d) => ({
    name: tStatus(d.status),
    value: d.count,
    status: d.status,
  }));

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">—</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          allowDecimals={false}
          reversed={locale === "ar"}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          width={80}
          orientation={locale === "ar" ? "right" : "left"}
        />
        <Tooltip
          formatter={(value) => [
            value,
            locale === "ar" ? "طلبات" : "orders",
          ]}
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={STATUS_COLORS[entry.status] ?? "#b8860b"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
