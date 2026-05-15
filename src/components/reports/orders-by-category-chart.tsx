"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "next-intl";

const COLORS = ["#b8860b", "#2c1810", "#8b6914", "#d4a017", "#6b4c0d"];

interface Props {
  data: { category: string; count: number; revenue: number }[];
}

export function OrdersByCategoryChart({ data }: Props) {
  const tCat = useTranslations("orders.categories");
  const locale = useLocale() as "ar" | "en";

  const chartData = data.map((d) => ({
    name: tCat(d.category),
    value: d.count,
    revenue: d.revenue,
  }));

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">—</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={3}
          dataKey="value"
          label={({ name, percent }) =>
            `${name} ${Math.round((percent ?? 0) * 100)}%`
          }
          labelLine={false}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, _name, entry) => [
            `${value} ${locale === "ar" ? "طلب" : "orders"} · ${formatCurrency((entry as { payload?: { revenue?: number } }).payload?.revenue ?? 0, locale)}`,
            "",
          ]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
