import { NextRequest, NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function POST(req: NextRequest) {
  try {
    const { nome, email, importo, paypal_order_id } = await req.json()

    const importoFormattato = Number(importo).toFixed(2).replace('.', ',')

    const message = `
💶 <b>Nuova donazione ricevuta!</b>

👤 <b>Nome:</b> ${nome}
📧 <b>Email:</b> ${email}
💰 <b>Importo:</b> €${importoFormattato}
🔑 <b>PayPal Order ID:</b> <code>${paypal_order_id}</code>
    `.trim()

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json({ error: 'Errore notifica Telegram' }, { status: 500 })
  }
}