import { prisma } from "@/lib/db";

const MOCK = process.env.WHATSAPP_MOCK_MODE !== "false";

interface SendArgs {
  to: string;
  message: string;
  /** Optional: notify these dashboard users in-app too */
  notifyUserIds?: string[];
  /** For DB notification metadata */
  link?: string;
  type?: string;
  title?: string;
}

/**
 * Send a WhatsApp message to a customer.
 * In MOCK mode (default for dev): logs to console + writes a Notification row
 * for any internal users that should know about it.
 *
 * In production: replace this with WhatsApp Business API integration.
 */
export async function sendWhatsApp({
  to,
  message,
  notifyUserIds = [],
  link,
  type = "WHATSAPP_SENT",
  title,
}: SendArgs): Promise<{ ok: boolean; messageId?: string }> {
  if (MOCK) {
    const ts = new Date().toISOString();
    console.log(
      `\n📱 [WhatsApp Mock ${ts}]\n   → To: ${to}\n   → Body: ${message}\n`,
    );

    if (notifyUserIds.length > 0) {
      await prisma.notification.createMany({
        data: notifyUserIds.map((userId) => ({
          userId,
          type,
          title: title ?? "WhatsApp message sent",
          message: `Sent to ${to}: ${message.slice(0, 100)}${message.length > 100 ? "…" : ""}`,
          link: link ?? null,
        })),
      });
    }

    return { ok: true, messageId: `mock-${Date.now()}` };
  }

  // TODO production: real WhatsApp Business API call here
  console.warn("[WhatsApp] Production mode but no API integration yet");
  return { ok: false };
}

/** Pre-baked message templates. */
export const whatsappTemplates = {
  orderCreated: (orderNumber: string, productType: string) =>
    `مرحباً 👋\nتم استلام طلبك بنجاح\nرقم الطلب: ${orderNumber}\nالمنتج: ${productType}\nسنوافيك بكل التحديثات أولاً بأول.\n— مصنع أخشاب القصور`,

  stageStarted: (orderNumber: string, stageName: string) =>
    `تحديث على طلبك ${orderNumber}:\nبدأنا الآن مرحلة "${stageName}" ✅\n— مصنع أخشاب القصور`,

  stageCompleted: (orderNumber: string, stageName: string) =>
    `تحديث على طلبك ${orderNumber}:\nاكتملت مرحلة "${stageName}" بنجاح 🎉\n— مصنع أخشاب القصور`,

  orderReady: (orderNumber: string) =>
    `طلبك ${orderNumber} أصبح جاهزاً 🎁\nسنتواصل معك لتنسيق موعد التسليم.\n— مصنع أخشاب القصور`,

  paymentReceived: (orderNumber: string, amount: number) =>
    `استلمنا دفعة بمبلغ ${amount.toFixed(2)} ر.س لطلبك ${orderNumber} ✅\nشكراً لك.\n— مصنع أخشاب القصور`,

  trackingLink: (orderNumber: string, link: string) =>
    `يمكنك متابعة طلبك ${orderNumber} مباشرة عبر هذا الرابط:\n${link}\n— مصنع أخشاب القصور`,
};
