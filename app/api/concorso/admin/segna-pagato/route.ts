import { NextRequest, NextResponse } from 'next/server'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL
const ADMIN_SECRET = process.env.CONCORSO_ADMIN_SECRET

export async function POST(req: NextRequest) {
  const { id, metodo } = await req.json()
  const res = await fetch(`${STRAPI_URL}/concorso/admin/${id}/segna-pagato`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET || '' },
    body: JSON.stringify({ metodo }),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}