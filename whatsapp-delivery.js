(function (root) {
    'use strict';
    const watching = new Set();
    let signup = {};
    if (root.addEventListener) root.addEventListener('message', event => {
        if (!['https://www.facebook.com', 'https://web.facebook.com', 'https://business.facebook.com'].includes(event.origin)) return;
        try {
            const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            if (payload?.type !== 'WA_EMBEDDED_SIGNUP' || !String(payload.event).startsWith('FINISH')) return;
            const { waba_id, phone_number_id } = payload.data || {};
            if (/^\d+$/.test(waba_id) && /^\d+$/.test(phone_number_id)) signup = { wabaId: String(waba_id), phoneNumberId: String(phone_number_id) };
        } catch {}
    });

    function resetSignup() { signup = {}; }
    async function getSignupSelection() {
        // Meta may post the selected account just after the OAuth callback.
        for (let i = 0; i < 10 && !signup.phoneNumberId; i++) await new Promise(resolve => setTimeout(resolve, 150));
        return { ...signup };
    }

    async function watch(messageId, fetchStatus, notify, pause = ms => new Promise(resolve => setTimeout(resolve, ms))) {
        if (!messageId || watching.has(messageId)) return;
        watching.add(messageId);
        try {
            for (let attempt = 0; attempt < 8; attempt++) {
                await pause(3000);
                const response = await fetchStatus(messageId);
                const data = await response.json();
                if (data.status === 'failed') {
                    notify(data.error || 'WhatsApp rechazó el mensaje. Revisa la conexión de la clínica.', true);
                    return;
                }
                if (data.status === 'delivered' || data.status === 'read') {
                    notify('WhatsApp confirmó la entrega del mensaje.', false);
                    return;
                }
            }
            notify('WhatsApp aceptó el mensaje; la entrega todavía no está confirmada.', false);
        } catch {
            notify('No se pudo confirmar la entrega. Revisa la conversación antes de reenviar.', false);
        } finally {
            watching.delete(messageId);
        }
    }

    root.AsistencitasWhatsApp = { watch, resetSignup, getSignupSelection };
    if (typeof module !== 'undefined' && module.exports) module.exports = { watch };
})(typeof window !== 'undefined' ? window : globalThis);
