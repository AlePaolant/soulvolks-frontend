import { NextRequest, NextResponse } from 'next/server'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1338/api'
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
const PAYPAL_SECRET = process.env.PAYPAL_SECRET_KEY
const PAYPAL_BASE = 'https://api-m.paypal.com'
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
const BREVO_API_KEY = process.env.BREVO_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'support@soulvolks.it'

async function getPayPalToken(): Promise<string> {
    const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
    })
    const data = await res.json()
    return data.access_token
}

async function verifyPayPalOrder(orderId: string, retries = 3): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
        try {
            const token = await getPayPalToken()
            const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            })
            const data = await res.json()
            return data.status === 'COMPLETED'
        } catch {
            if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)))
        }
    }
    return false
}

async function sendConfirmationEmail(entry: any) {
    if (!BREVO_API_KEY || !entry.email) return
    try {
        await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': BREVO_API_KEY,
            },
            body: JSON.stringify({
                sender: { name: 'Soul Volks', email: EMAIL_FROM },
                to: [{ email: entry.email, name: `${entry.nome} ${entry.cognome}` }],
                subject: 'Iscrizione al concorso fotografico confermata — Soul Volks',
                htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
            <h2 style="color:#e2572b">Iscrizione confermata!</h2>
            <p>Ciao ${entry.nome},</p>
            <p>Il tuo pagamento di €10,00 per il concorso fotografico <strong>Racconti visivi del Volks Camp 2026</strong> è stato ricevuto correttamente. La tua iscrizione è ufficialmente confermata.</p>
            <p>In bocca al lupo per il concorso!</p>
            <p style="color:#888;font-size:13px">Soul Volks Club — Molise, Italia</p>
          </div>
        `,
            }),
        })
    } catch { /* non blocchiamo la risposta se l'invio fallisce */ }
}

async function notifyTelegram(entry: any) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return
    const testo = `✅ *Concorso — pagamento PayPal ricevuto*\n\n👤 ${entry.nome} ${entry.cognome}\n📧 ${entry.email}\n📞 ${entry.telefono}\n💶 €10,00 pagati\n\nNessuna azione richiesta, iscrizione già confermata.`
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: testo, parse_mode: 'Markdown' }),
        })
    } catch { /* non blocchiamo la risposta all'utente se Telegram fallisce */ }
}

export async function POST(req: NextRequest) {
    try {
        const { entryId, paypalOrderId } = await req.json()

        if (!entryId || !paypalOrderId) {
            return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
        }

        const entryRes = await fetch(`${STRAPI_URL}/concorso-entries/${entryId}`, {
            headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` },
        })
        if (!entryRes.ok) {
            return NextResponse.json({ error: 'Iscrizione non trovata' }, { status: 404 })
        }
        const entryData = await entryRes.json()
        if (entryData.data?.statoPagamento === 'pagato_paypal') {
            return NextResponse.json({ success: true, alreadyPaid: true })
        }

        const isValid = await verifyPayPalOrder(paypalOrderId)
        if (!isValid) {
            return NextResponse.json({ error: 'Pagamento non verificato' }, { status: 400 })
        }

        const updateRes = await fetch(`${STRAPI_URL}/concorso-entries/${entryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${STRAPI_TOKEN}`,
            },
            body: JSON.stringify({
                data: { statoPagamento: 'pagato_paypal', paypalOrderId },
            }),
        })

        if (!updateRes.ok) {
            const err = await updateRes.json()
            return NextResponse.json({ error: err }, { status: 400 })
        }

        await notifyTelegram(entryData.data)
        await sendConfirmationEmail(entryData.data)


        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
    }
}