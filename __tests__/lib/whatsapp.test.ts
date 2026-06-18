import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendWelcomeMessage, sendBirthdayMessage, sendWinbackMessage } from '~/lib/whatsapp';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('WhatsApp template names', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        process.env.WA_PHONE_ID = 'test_phone_id';
        process.env.WA_TOKEN = 'test_token';
    });

    afterEach(() => {
        delete process.env.WA_PHONE_ID;
        delete process.env.WA_TOKEN;
    });

    it('sendWelcomeMessage uses welcome_coupon template', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ messages: [{ id: 'msg_1' }] }),
        });

        await sendWelcomeMessage({
            phone: '+919876543210',
            name: 'Test',
            restaurantName: 'Test Rest',
            couponCode: 'W50-ABC',
            discount: 50,
        });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.template.name).toBe('welcome_coupon');
    });

    it('sendBirthdayMessage uses birthday_coupon template', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ messages: [{ id: 'msg_2' }] }),
        });

        await sendBirthdayMessage({
            phone: '+919876543210',
            name: 'Test',
            restaurantName: 'Test Rest',
            couponCode: 'BDAY-XYZ',
            discount: 100,
        });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.template.name).toBe('birthday_coupon');
    });

    it('sendWinbackMessage uses winback_coupon template', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ messages: [{ id: 'msg_3' }] }),
        });

        await sendWinbackMessage({
            phone: '+919876543210',
            name: 'Test',
            restaurantName: 'Test Rest',
            couponCode: 'WB-DEF',
            discount: 75,
        });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.template.name).toBe('winback_coupon');
    });

    it('strips + from phone number in the request body', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ messages: [{ id: 'msg_4' }] }),
        });

        await sendWelcomeMessage({
            phone: '+919876543210',
            name: 'Test',
            restaurantName: 'Test Rest',
            couponCode: 'W50-ABC',
            discount: 50,
        });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.to).toBe('919876543210');
    });

    it('returns error when WA credentials are missing', async () => {
        delete process.env.WA_PHONE_ID;
        delete process.env.WA_TOKEN;

        const result = await sendWelcomeMessage({
            phone: '+919876543210',
            name: 'Test',
            restaurantName: 'Test Rest',
            couponCode: 'W50-ABC',
            discount: 50,
        });

        expect(result.success).toBe(false);
        expect(mockFetch).not.toHaveBeenCalled();
    });
});
