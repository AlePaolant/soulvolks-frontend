import { NextRequest, NextResponse } from 'next/server'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL
const SCANNER_TOKEN = process.env.SCANNER_API_TOKEN

export async function GET(req: NextRequest) {
  const uuid = req.nextUrl.searchParams.get('uuid')
  if (!uuid) return NextResponse.json({ error: 'UUID mancante' }, { status: 400 })

  try {
    const res = await fetch(
      `${STRAPI_URL}/bigliettos?filters[uuid][$eq]=${uuid}&populate=*`,
      {
        headers: { Authorization: `Bearer ${SCANNER_TOKEN}` },
        cache: 'no-store',
      }
    )
    const data = await res.json()

    if (!data.data || data.data.length === 0) {
      return NextResponse.json({ error: 'Biglietto non trovato' }, { status: 404 })
    }

    return NextResponse.json({ biglietto: data.data[0] })
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}