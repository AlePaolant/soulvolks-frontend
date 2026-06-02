import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'

export async function POST(req: NextRequest) {
    try {
        const { uuid, nome, cognome, tipo, zona, targa, modello, anno, n_passeggeri } = await req.json()

        // Genera QR code come PNG base64
        const qrDataUrl = await QRCode.toDataURL(uuid, { width: 200, margin: 1, color: { dark: '#15120d', light: '#0000' } })
        const qrBase64 = qrDataUrl.split(',')[1]
        const qrBytes = Buffer.from(qrBase64, 'base64')

        // Crea PDF
        const pdfDoc = await PDFDocument.create()
        const page = pdfDoc.addPage([595, 500])
        const { width, height } = page.getSize()

        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

        const nero = rgb(0.082, 0.071, 0.051)
        const rosso = rgb(0.882, 0.153, 0.075)
        const panna = rgb(0.937, 0.933, 0.855)
        const grigio = rgb(0.5, 0.5, 0.5)

        // Sfondo panna
        page.drawRectangle({ x: 0, y: 0, width, height, color: panna })

        // Header scuro
        page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: nero })
        page.drawRectangle({ x: 0, y: height - 93, width, height: 3, color: rosso })

        // Soul Volks header
        page.drawText('SOUL VOLKS', { x: 30, y: height - 45, size: 24, font: fontBold, color: panna })
        page.drawText('MATESE VOLKS CAMP 2026', { x: 30, y: height - 65, size: 10, font: fontBold, color: rosso })
        page.drawText('7 · 8 · 9 AGOSTO 2026  ·  CAMPITELLO MATESE (CB)', { x: 30, y: height - 80, size: 8, font: fontRegular, color: rgb(0.6, 0.6, 0.5) })

        // QR Code
        const qrImage = await pdfDoc.embedPng(qrBytes)
        page.drawImage(qrImage, { x: 30, y: height - 310, width: 160, height: 160 })

        // Linea separatrice verticale
        page.drawLine({ start: { x: 210, y: height - 100 }, end: { x: 210, y: height - 330 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })

        // Dettagli
        const col = 230
        const details = [
            { label: 'INTESTATARIO', value: `${nome} ${cognome}` },
            { label: 'TIPO', value: tipo === 'volkswagen' ? 'Volkswagen' : 'Camper / Tenda' },
            { label: 'PARCHEGGIO', value: zona === 'A' ? 'Zona A — Volkswagen' : 'Zona B — Camping' },
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

        // Importo
        page.drawText('IMPORTO PAGATO', { x: col, y: y, size: 8, font: fontBold, color: grigio })
        page.drawText('€20,00', { x: col, y: y - 16, size: 18, font: fontBold, color: rosso })

        // Footer codice
        page.drawRectangle({ x: 0, y: 0, width, height: 50, color: nero })
        page.drawRectangle({ x: 0, y: 50, width, height: 2, color: rosso })
        page.drawText('CODICE BIGLIETTO', { x: 30, y: 32, size: 7, font: fontBold, color: rgb(0.5, 0.5, 0.4) })
        page.drawText(uuid, { x: 30, y: 18, size: 9, font: fontBold, color: panna })

        const pdfBytes = await pdfDoc.save()

        return new NextResponse(Buffer.from(pdfBytes), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="biglietto-mvc2026-${uuid.slice(0, 8)}.pdf"`,
            },
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Errore generazione PDF' }, { status: 500 })
    }
}