'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { watch } = require('../whatsapp-delivery');

test('delivery observer surfaces failures reported after Meta accepted the send', async () => {
    const notifications = [];
    await watch('wamid.failure', async () => ({ json: async () => ({ status: 'failed', error: 'El paciente debe escribir primero.' }) }), (...args) => notifications.push(args), async () => {});
    assert.deepEqual(notifications, [['El paciente debe escribir primero.', true]]);
});

test('acceptance without a delivery event is never presented as delivered', async () => {
    const notifications = [];
    let polls = 0;
    await watch('wamid.pending', async () => { polls++; return { json: async () => ({ status: 'accepted' }) }; }, (...args) => notifications.push(args), async () => {});
    assert.equal(polls, 8);
    assert.match(notifications[0][0], /todavía no está confirmada/);
});

test('a delivered event ends polling and confirms delivery', async () => {
    let polls = 0;
    const notifications = [];
    await watch('wamid.delivered', async () => { polls++; return { json: async () => ({ status: 'delivered' }) }; }, (...args) => notifications.push(args), async () => {});
    assert.equal(polls, 1);
    assert.deepEqual(notifications, [['WhatsApp confirmó la entrega del mensaje.', false]]);
});

for (const specialty of ['medicina', 'odontologia', 'veterinaria', 'nutricion', 'fisioterapia']) {
    test(`${specialty}: scripts parse and WhatsApp failure after save does not restart clinical or billing writes`, async () => {
        const html = fs.readFileSync(path.join(__dirname, `../dashboard-${specialty}.html`), 'utf8');
        for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) if (match[1].trim()) new vm.Script(match[1]);
        const start = html.indexOf('    async function authenticatedApiFetch(');
        const end = html.indexOf('    const db = firebase.firestore();', start);
        assert.ok(start > 0 && end > start);
        const alerts = [];
        const context = vm.createContext({
            auth: { currentUser: { getIdToken: async () => 'test-id-token' } },
            Headers, URL, API_BASE_URL: 'https://api.example.test',
            window: { location: { href: 'https://example.test' } },
            alert: message => alerts.push(message),
            fetch: async (url, options) => {
                assert.equal(options.headers.get('Authorization'), 'Bearer test-id-token');
                return { ok: false, status: 502, clone: () => ({ json: async () => ({ error: 'Reconecta WhatsApp.' }) }) };
            }
        });
        vm.runInContext(html.slice(start, end), context);
        const result = await vm.runInContext("sendWhatsappAfterSave('https://api.example.test/send-prescription', {})", context);
        assert.equal(result, null);
        assert.equal(alerts[0], 'Los datos se guardaron, pero no se pudo enviar por WhatsApp: Reconecta WhatsApp.');
        assert.match(html, /await sendWhatsappAfterSave\(`\$\{API_BASE_URL\}\/send-prescription`/);
    });
}
