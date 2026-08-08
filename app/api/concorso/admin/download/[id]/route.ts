import { NextRequest, NextResponse } from 'next/server'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL
const ADMIN_SECRET = process.env.CONCORSO_ADMIN_SECRET

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`${STRAPI_URL}/concorso/admin/${id}/download`, {
    headers: { 'x-admin-secret': ADMIN_SECRET || '' },
  })
  if (!res.ok) return NextResponse.json({ error: 'Errore download' }, { status: res.status })
  const blob = await res.blob()
  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': res.headers.get('content-disposition') || 'attachment',
    },
  })
}