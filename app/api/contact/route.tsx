import { NextRequest, NextResponse } from 'next/server'

const BREVO_API_KEY = process.env.BREVO_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'support@soulvolks.it'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject } = await req.json()

    // Email a Soul Volks
    const htmlAdmin = `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#f5f0e8;">
    <div style="background:#15120d;padding:32px 48px;">
      <div style="border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:20px;margin-bottom:20px;">
        <span style="font-size:24px;font-weight:900;color:#efeed7;letter-spacing:-1px;text-transform:uppercase;">SOUL VOLKS</span>
        <span style="display:block;font-size:10px;color:rgba(239,238,215,0.4);letter-spacing:4px;text-transform:uppercase;margin-top:4px;">Nuovo messaggio dal sito</span>
      </div>
      <h1 style="margin:0;font-size:28px;font-weight:900;color:#efeed7;letter-spacing:-1px;">
        Hai ricevuto<br>un messaggio!
      </h1>
    </div>
    <div style="padding:40px 48px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid rgba(21,18,13,0.08);">
          <td style="padding:12px 0;font-size:11px;color:rgba(21,18,13,0.4);letter-spacing:2px;text-transform:uppercase;width:30%;">Nome</td>
          <td style="padding:12px 0;font-size:14px;font-weight:600;color:#15120d;">${name}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(21,18,13,0.08);">
          <td style="padding:12px 0;font-size:11px;color:rgba(21,18,13,0.4);letter-spacing:2px;text-transform:uppercase;">Email</td>
          <td style="padding:12px 0;font-size:14px;font-weight:600;color:#15120d;">
            <a href="mailto:${email}" style="color:#e12713;">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 0 0;font-size:11px;color:rgba(21,18,13,0.4);letter-spacing:2px;text-transform:uppercase;vertical-align:top;">Messaggio</td>
          <td style="padding:16px 0 0;font-size:14px;color:#15120d;line-height:1.6;">${subject}</td>
        </tr>
      </table>
    </div>
    <div style="padding:24px 48px;background:#15120d;border-top:3px solid #e12713;">
      <p style="margin:0;font-size:10px;color:rgba(239,238,215,0.2);letter-spacing:1px;">© 2026 Soul Volks · soulvolks.it</p>
    </div>
  </div>
</body>
</html>`

    // Email di conferma all'utente
    const htmlUtente = `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#f5f0e8;">
    <div style="background:#15120d;padding:32px 48px;">
      <div style="border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:20px;margin-bottom:20px;">
        <span style="font-size:24px;font-weight:900;color:#efeed7;letter-spacing:-1px;text-transform:uppercase;">SOUL VOLKS</span>
        <span style="display:block;font-size:10px;color:rgba(239,238,215,0.4);letter-spacing:4px;text-transform:uppercase;margin-top:4px;">Original Ride · Est. 2023 · Molise</span>
      </div>
      <h1 style="margin:0;font-size:28px;font-weight:900;color:#efeed7;letter-spacing:-1px;">
        Ciao ${name},<br>abbiamo ricevuto<br>il tuo messaggio!
      </h1>
    </div>
    <div style="padding:40px 48px;border-bottom:1px solid rgba(21,18,13,0.1);">
      <p style="margin:0;font-size:14px;color:rgba(21,18,13,0.6);line-height:1.6;">
        Grazie per averci contattato. Ti risponderemo il prima possibile all'indirizzo <strong style="color:#15120d;">${email}</strong>.
      </p>
    </div>
    <div style="padding:32px 48px;background:#15120d;border-left:4px solid #e12713;">
      <p style="margin:0 0 8px;font-size:10px;color:rgba(239,238,215,0.4);letter-spacing:3px;text-transform:uppercase;">Il tuo messaggio</p>
      <p style="margin:0;font-size:14px;color:rgba(239,238,215,0.7);line-height:1.6;font-style:italic;">${subject}</p>
    </div>
    <div style="padding:32px 48px;">
      <p style="margin:0;font-size:13px;color:rgba(21,18,13,0.5);line-height:1.6;">
        Nel frattempo seguici sui social per restare aggiornato su eventi, raduni e novità del club.
      </p>
    </div>
    <div style="padding:24px 48px;background:#15120d;border-top:3px solid #e12713;">
      <p style="margin:0 0 4px;font-size:11px;color:rgba(239,238,215,0.4);letter-spacing:2px;text-transform:uppercase;">Soul Volks</p>
      <p style="margin:0;font-size:12px;color:rgba(239,238,215,0.3);">info@soulvolks.it · instagram @soul_volks</p>
      <p style="margin:12px 0 0;font-size:10px;color:rgba(239,238,215,0.15);">© 2026 Soul Volks · Tutti i diritti riservati</p>
    </div>
  </div>
</body>
</html>`

    // Manda entrambe le email
    await Promise.all([
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY! },
        body: JSON.stringify({
          sender: { name: 'Soul Volks', email: EMAIL_FROM },
          to: [{ email: 'info@soulvolks.it', name: 'Soul Volks' }],
          replyTo: { email, name },
          subject: `Messaggio dal sito — ${name}`,
          htmlContent: htmlAdmin,
        }),
      }),
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY! },
        body: JSON.stringify({
          sender: { name: 'Soul Volks', email: EMAIL_FROM },
          to: [{ email, name }],
          subject: `Abbiamo ricevuto il tuo messaggio — Soul Volks`,
          htmlContent: htmlUtente,
        }),
      }),
    ])

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Errore invio' }, { status: 500 })
  }
}