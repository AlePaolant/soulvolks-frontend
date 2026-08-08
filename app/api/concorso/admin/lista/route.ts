import { NextResponse } from 'next/server'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL
const ADMIN_SECRET = process.env.CONCORSO_ADMIN_SECRET

export async function GET() {
  const res = await fetch(`${STRAPI_URL}/concorso/admin/lista`, {
    headers: { 'x-admin-secret': ADMIN_SECRET || '' },
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}