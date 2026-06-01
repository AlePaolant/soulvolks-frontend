import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1338/api'
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
const PAYPAL_SECRET = process.env.PAYPAL_SECRET_KEY
//const PAYPAL_BASE = 'https://api-m.paypal.com' // produzione
 const PAYPAL_BASE = 'https://api-m.sandbox.paypal.com' // sandbox

// Rate limiting
const rateLimitMap = new Map<string, number>()
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const last = rateLimitMap.get(ip) || 0
  if (now - last < 10000) return false
  rateLimitMap.set(ip, now)
  return true
}

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

async function verifyPayPalOrder(orderId: string): Promise<boolean> {
  try {
    const token = await getPayPalToken()
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const data = await res.json()
    return data.status === 'COMPLETED'
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Troppi tentativi. Riprova tra qualche secondo.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { nome, cognome, email, telefono, n_passeggeri, targa, tipo, modello, anno, note, paypal_order_id } = body

    // Verifica PayPal
    const isValid = await verifyPayPalOrder(paypal_order_id)
    if (!isValid) {
      return NextResponse.json({ error: 'Pagamento non verificato.' }, { status: 400 })
    }

    const zona = tipo === 'volkswagen' ? 'A' : 'B'
    const prezzo = 20
    const uuid = uuidv4()

    const biglietto = {
      nome,
      cognome,
      email,
      telefono,
      n_passeggeri: parseInt(n_passeggeri),
      targa: targa.toUpperCase(),
      tipo,
      zona,
      prezzo,
      stato: 'pagato',
      metodo_pagamento: 'paypal',
      paypal_order_id,
      uuid,
      modello: modello || null,
      anno: anno ? parseInt(anno) : null,
      note: note || null,
    }

    const res = await fetch(`${STRAPI_URL}/bigliettos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify({ data: biglietto }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err }, { status: 400 })
    }

    const data = await res.json()
    return NextResponse.json({ success: true, biglietto: data.data, uuid })

  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}