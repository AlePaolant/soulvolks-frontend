import { NextRequest, NextResponse } from 'next/server'

const BREVO_API_KEY = process.env.BREVO_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'support@soulvolks.it'

export async function POST(req: NextRequest) {
  try {
    const { email, nome, cognome, uuid, tipo, zona, targa, modello, anno, n_passeggeri } = await req.json()

    const tipoLabel = tipo === 'volkswagen' ? 'Volkswagen' : 'Auto/Camper/Tenda'
    const zonaLabel = zona === 'A' ? 'Zona A (Volkswagen)' : 'Zona B (Auto/Camper)'

    const htmlContent = `
      <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px;">
        <h1 style="font-size: 2rem; font-weight: 900; letter-spacing: -2px;">Soul<span style="color: #e63329;">Volks</span></h1>
        <h2 style="color: #e63329;">Prenotazione confermata!</h2>
        <p>Ciao <strong>${nome}</strong>, la tua prenotazione per il <strong>Matese Volks Camp 2026</strong> è confermata.</p>
        <hr style="border-color: #333; margin: 20px 0;">
        <h3>Dettagli biglietto</h3>
        <p>📋 <strong>Codice:</strong> ${uuid}</p>
        <p>🚗 <strong>Tipo:</strong> ${tipoLabel}</p>
        <p>📍 <strong>Parcheggio:</strong> ${zonaLabel}</p>
        <p>🏷️ <strong>Targa:</strong> ${targa}</p>
        ${modello ? `<p>🔧 <strong>Modello:</strong> ${modello} ${anno || ''}</p>` : ''}
        <p>👥 <strong>Passeggeri:</strong> ${n_passeggeri}</p>
        <p>💶 <strong>Prezzo pagato:</strong> €20,00</p>
        <hr style="border-color: #333; margin: 20px 0;">
        <p><strong>📅 Data:</strong> 7-8-9 Agosto 2026</p>
        <p><strong>📍 Luogo:</strong> Campitello Matese (CB)</p>
        <hr style="border-color: #333; margin: 20px 0;">
        <p style="font-size: 0.8rem; color: #666;">Mostra questo codice all'ingresso: <strong>${uuid}</strong></p>
        <p style="font-size: 0.8rem; color: #666;">Soul Volks — info@soulvolks.it</p>
      </div>
    `

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: { name: 'Soul Volks', email: EMAIL_FROM },
        to: [{ email, name: `${nome} ${cognome}` }],
        subject: `Prenotazione confermata — Matese Volks Camp 2026`,
        htmlContent,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json({ error: 'Errore invio email' }, { status: 500 })
  }
}