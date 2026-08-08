import { NextRequest, NextResponse } from 'next/server'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL
const ADMIN_SECRET = process.env.CONCORSO_ADMIN_SECRET
const BREVO_API_KEY = process.env.BREVO_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'support@soulvolks.it'

async function sendConfirmationEmail(entry: any) {
  if (!BREVO_API_KEY || !entry.email) return
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
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

export async function POST(req: NextRequest) {
  const { id, metodo } = await req.json()
  const res = await fetch(`${STRAPI_URL}/concorso/admin/${id}/segna-pagato`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET || '' },
    body: JSON.stringify({ metodo }),
  })
  const data = await res.json()
  if (res.ok && data.entry) {
    await sendConfirmationEmail(data.entry)
  }
  return NextResponse.json(data, { status: res.status })
}