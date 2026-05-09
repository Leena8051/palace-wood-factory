import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

import { requireUser } from "@/lib/auth-helpers";
import { getOrderById } from "@/lib/orders/queries";
import { generateQrDataUrl, buildTrackingUrl } from "@/lib/qr";
import { formatCurrency } from "@/lib/utils";
import { PrintTrigger } from "./print-trigger";

export default async function PrintInvoicePage({
  params,
}: PageProps<"/[locale]/orders/[id]/print">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireUser(locale as "ar" | "en");

  const order = await getOrderById(id);
  if (!order) notFound();

  const t = await getTranslations({ locale, namespace: "orders.invoice" });
  const tCat = await getTranslations({ locale, namespace: "orders.categories" });
  const tApp = await getTranslations({ locale, namespace: "app" });

  const dateLocale = locale === "ar" ? arLocale : undefined;
  const lc = locale as "ar" | "en";
  const trackingUrl = buildTrackingUrl(order.orderNumber);
  const qr = await generateQrDataUrl(trackingUrl, 160);

  const subtotal = order.finalPrice ?? order.estimatedPrice;
  const balanceDue = subtotal - order.paidAmount;

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>

      <div className="min-h-screen bg-muted/30 py-6 px-4">
        <PrintTrigger />

        <div className="print-page max-w-[210mm] mx-auto bg-white text-black shadow-xl rounded-lg p-8">
          {/* Header */}
          <header className="flex items-start justify-between border-b-4 border-[#2c1810] pb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#2c1810]">
                {tApp("name")}
              </h1>
              <p className="text-sm text-gray-600 mt-1">{tApp("tagline")}</p>
              <p className="text-xs text-gray-500 mt-3">
                المملكة العربية السعودية — Saudi Arabia
              </p>
            </div>
            <div className="text-end">
              <p className="text-3xl font-bold text-[#b8860b] uppercase tracking-wide">
                {t("invoice")}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {t("invoiceNumber")}: <span className="font-mono">{order.orderNumber}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t("issueDate")}: {format(new Date(), "dd MMM yyyy", { locale: dateLocale })}
              </p>
            </div>
          </header>

          {/* Bill to */}
          <section className="grid grid-cols-2 gap-6 mt-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                {t("billTo")}
              </p>
              <p className="font-bold text-base">{order.customer.fullName}</p>
              {order.customer.companyName && (
                <p className="text-sm">{order.customer.companyName}</p>
              )}
              <p className="text-sm" dir="ltr">{order.customer.phone}</p>
              {order.customer.email && (
                <p className="text-sm" dir="ltr">{order.customer.email}</p>
              )}
              <p className="text-sm">
                {order.customer.city}
                {order.customer.district ? ` — ${order.customer.district}` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                {t("orderInfo")}
              </p>
              <div className="space-y-1 text-sm">
                <Row label={t("orderDate")} value={format(order.orderDate, "dd MMM yyyy", { locale: dateLocale })} />
                {order.estimatedDelivery && (
                  <Row label={t("estimatedDelivery")} value={format(order.estimatedDelivery, "dd MMM yyyy", { locale: dateLocale })} />
                )}
                <Row label={t("category")} value={tCat(order.productCategory)} />
                <Row label={t("priority")} value={order.priority} />
              </div>
            </div>
          </section>

          {/* Items */}
          <section className="mt-8">
            <table className="w-full border border-gray-300 text-sm">
              <thead className="bg-[#2c1810] text-white">
                <tr>
                  <th className="text-start p-3">{t("description")}</th>
                  <th className="text-start p-3">{t("specs")}</th>
                  <th className="text-end p-3 w-32">{t("price")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 align-top border-t border-gray-200">
                    <p className="font-medium">{order.productType}</p>
                    <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                      {order.description}
                    </p>
                  </td>
                  <td className="p-3 align-top border-t border-gray-200 text-xs">
                    {order.width || order.height || order.depth ? (
                      <p>
                        {t("dimensions")}: {order.width ?? "?"} × {order.height ?? "?"} × {order.depth ?? "?"} cm
                      </p>
                    ) : null}
                    {order.woodType && <p>{t("woodType")}: {order.woodType}</p>}
                    {order.color && <p>{t("color")}: {order.color}</p>}
                    {order.finishType && <p>{t("finishType")}: {order.finishType}</p>}
                  </td>
                  <td className="p-3 align-top border-t border-gray-200 text-end font-bold">
                    {formatCurrency(subtotal, lc)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Totals */}
          <section className="mt-6 flex justify-end">
            <div className="w-72 text-sm">
              <Row label={t("subtotal")} value={formatCurrency(subtotal, lc)} />
              {order.deposit !== null && order.deposit > 0 && (
                <Row label={t("deposit")} value={formatCurrency(order.deposit, lc)} />
              )}
              <Row
                label={t("paid")}
                value={formatCurrency(order.paidAmount, lc)}
                green
              />
              <div className="border-t-2 border-[#2c1810] mt-2 pt-2">
                <Row
                  label={t("balanceDue")}
                  value={formatCurrency(Math.max(0, balanceDue), lc)}
                  bold
                />
              </div>
            </div>
          </section>

          {/* QR + footer */}
          <footer className="mt-10 pt-6 border-t border-gray-300 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                {t("trackingTitle")}
              </p>
              <p className="text-xs text-gray-700 mb-2">
                {t("trackingHint")}
              </p>
              <p className="text-[10px] font-mono break-all text-gray-600" dir="ltr">
                {trackingUrl}
              </p>
            </div>
            <div className="flex justify-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR" className="w-32 h-32" />
            </div>
          </footer>

          <div className="mt-6 text-center text-[10px] text-gray-500">
            {t("thankYou")} • {tApp("name")}
          </div>
        </div>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  bold,
  green,
}: {
  label: string;
  value: string;
  bold?: boolean;
  green?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-1 ${
        bold ? "text-base" : ""
      } ${green ? "text-green-700" : ""}`}
    >
      <span className={bold ? "font-bold" : "text-gray-600"}>{label}</span>
      <span className={bold ? "font-bold" : ""}>{value}</span>
    </div>
  );
}
