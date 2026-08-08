import { NextResponse } from 'next/server'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL
const ADMIN_SECRET = process.env.CONCORSO_ADMIN_SECRET

export async function GET() {
  const res = await fetch(`${STRAPI_URL}/concorso/admin/csv`, {
    headers: { 'x-admin-secret': ADMIN_SECRET || '' },
  })
  if (!res.ok) return NextResponse.json({ error: 'Errore export' }, { status: res.status })
  const text = await res.text()
  return new NextResponse(text, {
    headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="concorso-partecipanti.csv"' },
  })
}