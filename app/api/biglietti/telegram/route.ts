import { NextRequest, NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function POST(req: NextRequest) {
  try {
    const { nome, cognome, email, telefono, tipo, targa, modello, anno, n_passeggeri, uuid } = await req.json()

    const tipoLabel = tipo === 'volkswagen' ? '🚗 Volkswagen (Zona A)' : '🚙 Auto/Camper (Zona B)'

    const message = `
🎟️ <b>Nuovo biglietto venduto!</b>

👤 <b>Nome:</b> ${nome} ${cognome}
📧 <b>Email:</b> ${email}
📱 <b>Telefono:</b> ${telefono}
🚗 <b>Tipo:</b> ${tipoLabel}
🏷️ <b>Targa:</b> ${targa}
${modello ? `🔧 <b>Modello:</b> ${modello} ${anno || ''}` : ''}
👥 <b>Passeggeri:</b> ${n_passeggeri}
💶 <b>Prezzo:</b> €20,00
🔑 <b>UUID:</b> <code>${uuid}</code>
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