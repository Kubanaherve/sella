/**
 * Optional WhatsApp Business Platform (Cloud API) integration.
 *
 * Native share remains the default for ordinary Sella shop owners.
 * WABA is only used when the shop has explicitly configured credentials
 * and the owner authorizes each send — never auto-send financial PDFs.
 *
 * Official docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Required to enable (shop-level, not bundled for all users):
 * - Meta Business + WhatsApp Business Account
 * - Phone number ID + permanent access token
 * - Approved message templates for utility reminders (outside 24h window)
 * - Document upload via media API, then messages with type=document + caption
 * - Explicit customer opt-in / consent recorded by the shop
 *
 * This module intentionally does not send anything until credentials exist.
 */

export type WabaConfig = {
  phoneNumberId: string;
  accessToken: string;
  /** Optional Graph API version, e.g. v21.0 */
  apiVersion?: string;
};

export function isWabaConfigured(config: WabaConfig | null | undefined): boolean {
  return Boolean(config?.phoneNumberId && config?.accessToken);
}

/**
 * Placeholder for future Cloud API document send.
 * Returns false so callers keep using native share.
 */
export async function sendWabaDocumentReminder(_opts: {
  config: WabaConfig;
  toE164: string;
  caption: string;
  pdfBlob: Blob;
  fileName: string;
  /** Shop owner must have tapped Send / authorized this message */
  ownerAuthorized: boolean;
}): Promise<{ ok: false; reason: string }> {
  return {
    ok: false,
    reason:
      "WhatsApp Business API ntabwo yashyizweho kuri uyu shop. Koresha Share ya telefone.",
  };
}
