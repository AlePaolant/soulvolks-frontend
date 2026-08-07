import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'

const BREVO_API_KEY = process.env.BREVO_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'support@soulvolks.it'

export async function POST(req: NextRequest) {
  try {
    const { email, nome, cognome, uuid, tipo, zona, targa, modello, anno, n_passeggeri } = await req.json()

    const tipoLabel = tipo === 'volkswagen' ? 'Volkswagen' : 'Camper / Tenda'
    const zonaLabel = zona === 'A' ? 'Zona A — Parcheggio Volkswagen' : 'Zona B — Area Camping'

    /* Controlla se il biglietto è tra i primi 30 FALLITO
    */

    // Genera PDF lato server
    const qrDataUrl = await QRCode.toDataURL(uuid, { width: 200, margin: 1, color: { dark: '#15120d', light: '#0000' } })
    const qrBase64 = qrDataUrl.split(',')[1]
    const qrBytes = Buffer.from(qrBase64, 'base64')

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 500])
    const { width, height } = page.getSize()
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const nero = rgb(0.082, 0.071, 0.051)
    const rosso = rgb(0.882, 0.153, 0.075)
    const panna = rgb(0.937, 0.933, 0.855)
    const grigio = rgb(0.5, 0.5, 0.5)

    page.drawRectangle({ x: 0, y: 0, width, height, color: panna })
    page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: nero })
    page.drawRectangle({ x: 0, y: height - 93, width, height: 3, color: rosso })
    page.drawText('SOUL VOLKS', { x: 30, y: height - 45, size: 24, font: fontBold, color: panna })
    page.drawText('MATESE VOLKS CAMP 2026', { x: 30, y: height - 65, size: 10, font: fontBold, color: rosso })
    page.drawText('7 · 8 · 9 AGOSTO 2026  ·  CAMPITELLO MATESE (CB)', { x: 30, y: height - 80, size: 8, font: fontRegular, color: rgb(0.6, 0.6, 0.5) })

    const qrImage = await pdfDoc.embedPng(qrBytes)
    page.drawImage(qrImage, { x: 30, y: height - 310, width: 160, height: 160 })
    page.drawLine({ start: { x: 210, y: height - 100 }, end: { x: 210, y: height - 330 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })

    const col = 230
    const details = [
      { label: 'INTESTATARIO', value: `${nome} ${cognome}` },
      { label: 'TIPO', value: tipoLabel },
      { label: 'PARCHEGGIO', value: zonaLabel },
      { label: 'TARGA', value: targa.toUpperCase() },
      ...(modello ? [{ label: 'VEICOLO', value: `${modello} ${anno || ''}` }] : []),
      { label: 'PASSEGGERI', value: String(n_passeggeri) },
    ]

    let y = height - 115
    for (const detail of details) {
      page.drawText(detail.label, { x: col, y, size: 8, font: fontBold, color: grigio })
      page.drawText(detail.value, { x: col, y: y - 14, size: 11, font: fontBold, color: nero })
      page.drawLine({ start: { x: col, y: y - 22 }, end: { x: width - 30, y: y - 22 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) })
      y -= 38
    }

    page.drawText('IMPORTO PAGATO', { x: col, y, size: 8, font: fontBold, color: grigio })
    page.drawText('€20,00', { x: col, y: y - 16, size: 18, font: fontBold, color: rosso })
    page.drawRectangle({ x: 0, y: 0, width, height: 50, color: nero })
    page.drawRectangle({ x: 0, y: 50, width, height: 2, color: rosso })
    page.drawText('CODICE BIGLIETTO', { x: 30, y: 32, size: 7, font: fontBold, color: rgb(0.5, 0.5, 0.4) })
    page.drawText(uuid, { x: 30, y: 18, size: 9, font: fontBold, color: panna })

    const pdfBytes = await pdfDoc.save()
    const pdfAttachment = Buffer.from(pdfBytes as unknown as ArrayBuffer).toString('base64')


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
        MATESE<br><span style="color:#e12713;">VOLKS</span><br>CAMP
      </h1>
      <p style="margin:16px 0 0;font-size:11px;color:rgba(239,238,215,0.4);letter-spacing:3px;text-transform:uppercase;">
        7 · 8 · 9 Agosto 2026 · Campitello Matese (CB)
      </p>
    </div>
    <div style="padding:40px 48px 32px;border-bottom:1px solid rgba(21,18,13,0.1);">
      <p style="margin:0 0 8px;font-size:11px;color:rgba(21,18,13,0.4);letter-spacing:3px;text-transform:uppercase;">Prenotazione confermata</p>
      <h2 style="margin:0;font-size:28px;font-weight:900;color:#15120d;letter-spacing:-1px;">
        Ciao ${nome},<br>ci vediamo ad agosto!
      </h2>
      <p style="margin:16px 0 0;font-size:14px;color:rgba(21,18,13,0.6);line-height:1.6;">
        La tua prenotazione per il <strong style="color:#15120d;">Matese Volks Camp 2026</strong> è confermata. Trovi il biglietto in allegato.
      </p>
    </div>
    <div style="padding:32px 48px;background:#15120d;border-left:4px solid #e12713;">
      <p style="margin:0 0 8px;font-size:10px;color:rgba(239,238,215,0.4);letter-spacing:3px;text-transform:uppercase;">Codice biglietto</p>
      <p style="margin:0;font-size:15px;font-weight:700;color:#efeed7;letter-spacing:2px;word-break:break-all;font-family:monospace;">${uuid}</p>
    </div>
    <div style="padding:40px 48px;">
      <p style="margin:0 0 24px;font-size:11px;color:rgba(21,18,13,0.4);letter-spacing:3px;text-transform:uppercase;">Dettagli prenotazione</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid rgba(21,18,13,0.08);">
          <td style="padding:12px 0;font-size:11px;color:rgba(21,18,13,0.4);letter-spacing:2px;text-transform:uppercase;width:40%;">Intestatario</td>
          <td style="padding:12px 0;font-size:14px;font-weight:600;color:#15120d;">${nome} ${cognome}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(21,18,13,0.08);">
          <td style="padding:12px 0;font-size:11px;color:rgba(21,18,13,0.4);letter-spacing:2px;text-transform:uppercase;">Tipo</td>
          <td style="padding:12px 0;font-size:14px;font-weight:600;color:#15120d;">${tipoLabel}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(21,18,13,0.08);">
          <td style="padding:12px 0;font-size:11px;color:rgba(21,18,13,0.4);letter-spacing:2px;text-transform:uppercase;">Parcheggio</td>
          <td style="padding:12px 0;font-size:14px;font-weight:600;color:#15120d;">${zonaLabel}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(21,18,13,0.08);">
          <td style="padding:12px 0;font-size:11px;color:rgba(21,18,13,0.4);letter-spacing:2px;text-transform:uppercase;">Targa</td>
          <td style="padding:12px 0;font-size:14px;font-weight:600;color:#15120d;text-transform:uppercase;">${targa}</td>
        </tr>
        ${modello ? `
        <tr style="border-bottom:1px solid rgba(21,18,13,0.08);">
          <td style="padding:12px 0;font-size:11px;color:rgba(21,18,13,0.4);letter-spacing:2px;text-transform:uppercase;">Veicolo</td>
          <td style="padding:12px 0;font-size:14px;font-weight:600;color:#15120d;">${modello} ${anno || ''}</td>
        </tr>` : ''}
        <tr style="border-bottom:1px solid rgba(21,18,13,0.08);">
          <td style="padding:12px 0;font-size:11px;color:rgba(21,18,13,0.4);letter-spacing:2px;text-transform:uppercase;">Passeggeri</td>
          <td style="padding:12px 0;font-size:14px;font-weight:600;color:#15120d;">${n_passeggeri}</td>
        </tr>
        <tr>
          <td style="padding:16px 0 0;font-size:11px;color:rgba(21,18,13,0.4);letter-spacing:2px;text-transform:uppercase;">Importo pagato</td>
          <td style="padding:16px 0 0;font-size:22px;font-weight:900;color:#e12713;">€20,00</td>
        </tr>
      </table>
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
        to: [{ email, name: `${nome} ${cognome}` }],
        subject: `Prenotazione confermata — Matese Volks Camp 2026 · ${uuid.slice(0, 8).toUpperCase()}`,
        htmlContent,
        attachment: pdfAttachment ? [{
          content: pdfAttachment,
          name: `biglietto-mvc2026-${uuid.slice(0, 8)}.pdf`,
        }] : [],
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
