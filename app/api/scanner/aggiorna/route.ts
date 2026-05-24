import { NextRequest, NextResponse } from 'next/server'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL
const SCANNER_TOKEN = process.env.SCANNER_API_TOKEN

export async function POST(req: NextRequest) {
  const { documentId } = await req.json()
  if (!documentId) return NextResponse.json({ error: 'ID mancante' }, { status: 400 })

  try {
    const res = await fetch(`${STRAPI_URL}/bigliettos/${documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SCANNER_TOKEN}`,
      },
      body: JSON.stringify({ data: { stato: 'usato' } }),
      cache: 'no-store',
    })

    if (!res.ok) throw new Error()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Errore aggiornamento' }, { status: 500 })
  }
}