import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * CSV export of all customers (UTF-8 BOM so Excel reads Arabic correctly).
 * For 10K+ customers later: switch to streaming + paginated cursor.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  const headers = [
    "code",
    "name",
    "phone",
    "whatsapp",
    "email",
    "city",
    "district",
    "type",
    "company",
    "source",
    "vip",
    "orders",
    "joined",
    "notes",
  ];

  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = customers.map((c) =>
    [
      c.customerCode,
      c.fullName,
      c.phone,
      c.whatsapp ?? "",
      c.email ?? "",
      c.city,
      c.district ?? "",
      c.customerType,
      c.companyName ?? "",
      c.source,
      c.isVip ? "1" : "0",
      c._count.orders,
      c.createdAt.toISOString().slice(0, 10),
      c.notes ?? "",
    ]
      .map(escape)
      .join(","),
  );

  const csv =
    "﻿" + [headers.map(escape).join(","), ...rows].join("\n") + "\n";

  const filename = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
