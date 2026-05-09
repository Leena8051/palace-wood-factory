import QRCode from "qrcode";

/**
 * Generate a QR code as a data URL (PNG, base64).
 * Suitable for <img src={...}> or print invoices.
 */
export async function generateQrDataUrl(
  text: string,
  size = 220,
): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: { dark: "#2c1810", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
}

/**
 * Build the public tracking URL for an order.
 * Honours AUTH_URL or NEXT_PUBLIC_APP_URL or falls back to the supplied origin.
 */
export function buildTrackingUrl(orderNumber: string, origin?: string): string {
  const base =
    process.env.AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    origin ??
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/track/${orderNumber}`;
}
