import { NextRequest, NextResponse } from 'next/server'

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
const PAYPAL_SECRET = process.env.PAYPAL_SECRET_KEY
const PAYPAL_BASE = 'https://api-m.paypal.com' // produzione
//const PAYPAL_BASE = 'https://api-m.sandbox.paypal.com' // sandbox

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

// Verifica l'ordine e ritorna anche l'importo REALE pagato (presa da PayPal, non dal client)
async function verifyPayPalOrder(orderId: string): Promise<{ valid: boolean; importo?: string }> {
  try {
    const token = await getPayPalToken()
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const data = await res.json()

    if (data.status !== 'COMPLETED') {
      return { valid: false }
    }

    // L'importo capturato si trova in purchase_units[0].payments.captures[0].amount.value
    const importo = data.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value

    return { valid: true, importo }
  } catch {
    return { valid: false }
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Troppi tentativi. Riprova tra qualche secondo.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { nome, email, paypal_order_id } = body

    if (!nome || !email || !paypal_order_id) {
      return NextResponse.json({ error: 'Dati mancanti.' }, { status: 400 })
    }

    // Verifica PayPal - questo è il controllo di sicurezza principale
    const { valid, importo } = await verifyPayPalOrder(paypal_order_id)

    if (!valid || !importo) {
      return NextResponse.json({ error: 'Pagamento non verificato.' }, { status: 400 })
    }

    // Costruiamo l'URL base per chiamare le altre route interne
    const origin = req.nextUrl.origin

    const payload = { nome, email, importo, paypal_order_id }

    // Inviamo email e notifica telegram in parallelo
    // Non blocchiamo la risposta al donatore se una delle due fallisce:
    // logghiamo l'errore ma il "success" arriva comunque (il pagamento è già avvenuto)
    const [emailRes, telegramRes] = await Promise.allSettled([
      fetch(`${origin}/api/donazioni/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      fetch(`${origin}/api/donazioni/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    ])

    if (emailRes.status === 'rejected' || (emailRes.status === 'fulfilled' && !emailRes.value.ok)) {
      console.error('Errore invio email donazione:', emailRes)
    }
    if (telegramRes.status === 'rejected' || (telegramRes.status === 'fulfilled' && !telegramRes.value.ok)) {
      console.error('Errore invio telegram donazione:', telegramRes)
    }

    return NextResponse.json({ success: true, importo })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}