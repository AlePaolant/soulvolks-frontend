import { NextRequest, NextResponse } from 'next/server'

const BREVO_API_KEY = process.env.BREVO_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'support@soulvolks.it'

export async function POST(req: NextRequest) {
  try {
    const { email, nome, importo } = await req.json()

    const importoFormattato = Number(importo).toFixed(2).replace('.', ',')

    const htmlContent = `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#f5f0e8;">
    <div style="background:#15120d;padding:40px 48px 32px;">
      <div style="border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:24px;margin-bottom:24px;">
        <span style="font-size:28px;font-weight:900;color:#efeed7;letter-spacing:-1px;text-transform:uppercase;">SOUL VOLKS</span>
        <span style="display:block;font-size:10px;color:rgba(239,238,215,0.4);letter-spacing:4px;text-transform:uppercase;margin-top:4px;">Original Ride · Est. 2023 · Molise</span>
      </div>
      <h1 style="margin:0;font-size:42px;font-weight:900;color:#efeed7;letter-spacing:-2px;text-transform:uppercase;line-height:1;">
        GRAZIE<br>PER IL TUO<br><span style="color:#e12713;">SUPPORTO</span>
      </h1>
      <p style="margin:16px 0 0;font-size:11px;color:rgba(239,238,215,0.4);letter-spacing:3px;text-transform:uppercase;">
        Matese Volks Camp 2026 · 7 · 8 · 9 Agosto · Campitello Matese (CB)
      </p>
    </div>
    <div style="padding:40px 48px 32px;border-bottom:1px solid rgba(21,18,13,0.1);">
      <p style="margin:0 0 8px;font-size:11px;color:rgba(21,18,13,0.4);letter-spacing:3px;text-transform:uppercase;">Donazione ricevuta</p>
      <h2 style="margin:0;font-size:28px;font-weight:900;color:#15120d;letter-spacing:-1px;">
        Ciao ${nome},<br>sei fantastico!
      </h2>
      <p style="margin:16px 0 0;font-size:14px;color:rgba(21,18,13,0.6);line-height:1.6;">
        Abbiamo ricevuto la tua donazione di <strong style="color:#15120d;">€${importoFormattato}</strong> a supporto del <strong style="color:#15120d;">Matese Volks Camp 2026</strong>.
        Il tuo contributo ci aiuta a rendere questo evento ancora più speciale per tutta la community. Grazie di cuore!
      </p>
    </div>
    <div style="padding:32px 48px;background:#15120d;border-left:4px solid #e12713;">
      <p style="margin:0 0 8px;font-size:10px;color:rgba(239,238,215,0.4);letter-spacing:3px;text-transform:uppercase;">Importo donato</p>
      <p style="margin:0;font-size:32px;font-weight:900;color:#e12713;">€${importoFormattato}</p>
    </div>
    <div style="padding:32px 48px;background:#15120d;border-top:3px solid #e12713;">
      <p style="margin:0 0 8px;font-size:11px;color:rgba(239,238,215,0.4);letter-spacing:2px;text-transform:uppercase;">Soul Volks</p>
      <p style="margin:0;font-size:12px;color:rgba(239,238,215,0.3);">info@soulvolks.it · instagram @soul_volks</p>
      <p style="margin:16px 0 0;font-size:10px;color:rgba(239,238,215,0.15);letter-spacing:1px;">© 2026 Soul Volks · Tutti i diritti riservati</p>
    </div>
  </div>
</body>
</html>`

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: { name: 'Soul Volks', email: EMAIL_FROM },
        to: [{ email, name: nome }],
        subject: `Grazie per la tua donazione — Matese Volks Camp 2026`,
        htmlContent,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Errore invio email' }, { status: 500 })
  }
}