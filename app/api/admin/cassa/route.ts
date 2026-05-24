import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL
const ADMIN_TOKEN = process.env.ADMIN_TOKEN

export async function POST(req: NextRequest) {
  const auth = req.cookies.get('admin_auth')
  if (!auth || auth.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { nome, cognome, email, telefono, n_passeggeri, targa, tipo, modello, anno, note, metodo_pagamento } = body

    const zona = tipo === 'volkswagen' ? 'A' : 'B'
    const prezzo = metodo_pagamento === 'associato' ? 0 : 20
    const uuid = uuidv4()

    const biglietto = {
      nome, cognome, email, telefono,
      n_passeggeri: parseInt(n_passeggeri),
      targa: targa.toUpperCase(),
      tipo, zona, prezzo,
      stato: 'pagato',
      metodo_pagamento,
      uuid,
      modello: modello || null,
      anno: anno ? parseInt(anno) : null,
      note: note || null,
    }

    const res = await fetch(`${STRAPI_URL}/bigliettos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({ data: biglietto }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err }, { status: 400 })
    }

    // Manda email se c'è email
    if (email) {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/biglietti/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nome, cognome, uuid, tipo, zona, targa, modello, anno, n_passeggeri }),
      })
    }

    return NextResponse.json({ success: true, uuid })
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}