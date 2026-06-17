/**
 * WhatsApp messaging module for Restoloop.
 *
 * During development: all functions are mocked with console.log.
 * Phase 7 swap-in: replace the body of each function with the
 * real Meta Cloud API call using META_TOKEN + PHONE_ID env vars.
 * The typed interfaces below MUST NOT change — they are the contract.
 */

export interface WelcomeMessagePayload {
    phone: string;       // E.164 format preferred, e.g. "919876543210"
    name: string;
    restaurantName: string;
    couponCode: string;
    discount: number;    // ₹ amount
}

export interface BirthdayMessagePayload {
    phone: string;
    name: string;
    restaurantName: string;
    couponCode: string;
    discount: number;
}

export interface WinbackMessagePayload {
    phone: string;
    name: string;
    restaurantName: string;
    couponCode: string;
    discount: number;
}

export type MessageResult =
    | { success: true; messageId: string }
    | { success: false; error: string };

/** Send a welcome coupon message after a customer signs up. */
export async function sendWelcomeMessage(
    payload: WelcomeMessagePayload,
): Promise<MessageResult> {
    return sendMetaMessage(payload.phone, 'welcome_coupon', payload.discount.toString(), payload.couponCode);
}

/** Send a birthday coupon message. */
export async function sendBirthdayMessage(
    payload: BirthdayMessagePayload,
): Promise<MessageResult> {
    return sendMetaMessage(payload.phone, 'birthday_coupon', payload.discount.toString(), payload.couponCode);
}

/** Send a win-back coupon message. */
export async function sendWinbackMessage(
    payload: WinbackMessagePayload,
): Promise<MessageResult> {
    return sendMetaMessage(payload.phone, 'winback_coupon', payload.discount.toString(), payload.couponCode);
}

/** Helper function to send template messages via Meta Cloud API */
async function sendMetaMessage(phone: string, templateName: string, discount: string, couponCode: string): Promise<MessageResult> {
    const waPhoneId = process.env.WA_PHONE_ID;
    const waToken = process.env.WA_TOKEN;

    if (!waPhoneId || !waToken || waPhoneId === 'your_phone_id_here' || waToken === 'your_permanent_token_here') {
        console.warn('Missing WA credentials. Skipping live send.');
        return { success: false, error: 'Missing WA credentials' };
    }

    try {
        const response = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${waToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: phone.replace('+', ''),
                type: "template",
                template: {
                    name: "hello_world",
                    language: { code: "en_US" }
                }
            }),
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`WhatsApp API sending failed for ${templateName}:`, errBody);
            return { success: false, error: errBody };
        }

        const data = await response.json();
        return { success: true, messageId: data.messages?.[0]?.id || `wa_${Date.now()}` };
    } catch (apiErr: any) {
        console.error('Failed to reach WhatsApp API:', apiErr);
        return { success: false, error: apiErr.message || 'Network error' };
    }
}

/** Send a campaign or reminder message via a 3rd party WhatsApp Web API provider. */
export async function sendThirdPartyMessage(phone: string, text: string): Promise<MessageResult> {
    const provider = process.env.WHATSAPP_PROVIDER;
    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY;
    const instanceId = process.env.WHATSAPP_INSTANCE_ID;

    if (!provider || !apiUrl) {
        console.warn('Missing 3rd-party WhatsApp provider configuration. Falling back to log simulation.');
        console.log(`[SIMULATED 3RD PARTY SEND] To: ${phone}, Content: "${text}"`);
        return { success: true, messageId: `mock_3rd_${Date.now()}` };
    }

    try {
        let response;
        const normalizedPhone = phone.replace('+', '').replace(/\s/g, '');

        if (provider === 'ultramsg') {
            response = await fetch(`${apiUrl}/messages/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: apiKey,
                    to: normalizedPhone,
                    body: text,
                    priority: 1
                }),
                signal: AbortSignal.timeout(10000)
            });
        } else if (provider === 'evolution') {
            response = await fetch(`${apiUrl}/message/sendText/${instanceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey || ''
                },
                body: JSON.stringify({
                    number: normalizedPhone,
                    options: { delay: 1200, presence: "composing" },
                    textMessage: { text: text }
                }),
                signal: AbortSignal.timeout(10000)
            });
        } else if (provider === 'waha') {
            response = await fetch(`${apiUrl}/api/sendText`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': apiKey ? `Bearer ${apiKey}` : ''
                },
                body: JSON.stringify({
                    chatId: `${normalizedPhone}@c.us`,
                    text: text,
                    session: instanceId || 'default'
                }),
                signal: AbortSignal.timeout(10000)
            });
        } else {
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': apiKey ? `Bearer ${apiKey}` : ''
                },
                body: JSON.stringify({
                    phone: normalizedPhone,
                    message: text,
                    instance: instanceId
                }),
                signal: AbortSignal.timeout(10000)
            });
        }

        if (!response.ok) {
            const errText = await response.text();
            console.error(`3rd-party WhatsApp API delivery failed via ${provider}:`, errText);
            return { success: false, error: errText };
        }

        const data = await response.json();
        return { success: true, messageId: data.id || data.messageId || `3rd_${Date.now()}` };

    } catch (e: any) {
        console.error(`3rd-party WhatsApp send network failure:`, e);
        return { success: false, error: e.message || 'Network error' };
    }
}

