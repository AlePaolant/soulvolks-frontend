import { NextRequest, NextResponse } from 'next/server'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function POST(req: NextRequest) {
  const { entryId, metodo, nome, cognome, email, telefono } = await req.json()

  const res = await fetch(`${STRAPI_URL}/concorso/${entryId}/scegli-pagamento-manuale`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metodo }),
  })

  if (!res.ok) {
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    const testo = `📸 *Concorso — pagamento manuale scelto*\n\n👤 ${nome} ${cognome}\n📧 ${email}\n📞 ${telefono}\n💳 Metodo: *${metodo === 'contanti' ? 'Contanti' : 'Bonifico'}*\n⏰ Scade tra 48h se non confermato\n\nVai in dashboard → Concorso per segnarlo come pagato quando arriva.`
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: testo, parse_mode: 'Markdown' }),
      })
    } catch { /* non blocchiamo la risposta all'utente se Telegram fallisce */ }
  }

  return NextResponse.json({ ok: true })
}