import { NextRequest, NextResponse } from 'next/server'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1338/api'
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
const PAYPAL_SECRET = process.env.PAYPAL_SECRET_KEY
const PAYPAL_BASE = 'https://api-m.paypal.com' // produzione, stesse credenziali live dei biglietti

async function getPayPalToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

async function verifyPayPalOrder(orderId: string, retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const token = await getPayPalToken()
      const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await res.json()
      return data.status === 'COMPLETED'
    } catch {
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  return false
}

export async function POST(req: NextRequest) {
  try {
    const { entryId, paypalOrderId } = await req.json()

    if (!entryId || !paypalOrderId) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
    }

    // Recupera l'entry, controlla che non sia già stata pagata (evita doppie verifiche)
    const entryRes = await fetch(`${STRAPI_URL}/concorso-entries/${entryId}`, {
      headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` },
    })
    if (!entryRes.ok) {
      return NextResponse.json({ error: 'Iscrizione non trovata' }, { status: 404 })
    }
    const entryData = await entryRes.json()
    if (entryData.data?.statoPagamento === 'pagato_paypal') {
      return NextResponse.json({ success: true, alreadyPaid: true })
    }

    const isValid = await verifyPayPalOrder(paypalOrderId)
    if (!isValid) {
      return NextResponse.json({ error: 'Pagamento non verificato' }, { status: 400 })
    }

    const updateRes = await fetch(`${STRAPI_URL}/concorso-entries/${entryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify({
        data: { statoPagamento: 'pagato_paypal', paypalOrderId },
      }),
    })

    if (!updateRes.ok) {
      const err = await updateRes.json()
      return NextResponse.json({ error: err }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}