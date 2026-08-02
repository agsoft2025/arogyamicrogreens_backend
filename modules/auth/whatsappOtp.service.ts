const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';
const OTP_TEMPLATE_NAME = process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'authentication_otp';
const OTP_TEMPLATE_LANGUAGE = process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE || 'en_US';

/**
 * India-only: WhatsApp Cloud API requires the destination number in
 * international format without a leading '+'. UI collects a bare 10-digit
 * number, so the country code is prepended here.
 */
function toWhatsappNumber(mobileNumber: string): string {
  const digits = mobileNumber.replace(/\D/g, '');
  return digits.startsWith('91') ? digits : `91${digits}`;
}

/**
 * Sends the OTP via an approved WhatsApp authentication template.
 * Plain-text messages only work inside a 24h customer-service window, which
 * a first-time login/signup can't rely on -- a template is required for
 * business-initiated OTP delivery.
 */
export async function sendWhatsappOtp(mobileNumber: string, otp: string): Promise<void> {
  const phoneNumberId = process.env.PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
console.log("<><>phoneNumberId",phoneNumberId)
console.log("<><>token",token)
  if (!phoneNumberId || !token) {
    throw new Error('WhatsApp credentials are not configured');
  }

  const response = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toWhatsappNumber(mobileNumber),
        type: 'template',
        template: {
          name: OTP_TEMPLATE_NAME,
          language: { code: OTP_TEMPLATE_LANGUAGE },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: otp }],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [{ type: 'text', text: otp }],
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`WhatsApp OTP send failed (${response.status}): ${errorBody}`);
    throw new Error('Failed to send OTP. Please try again.');
  }
}
