import { NextRequest, NextResponse } from 'next/server'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL
const ADMIN_TOKEN = process.env.ADMIN_TOKEN

export async function GET(req: NextRequest) {
    // Verifica auth
    const auth = req.cookies.get('admin_auth')
    if (!auth || auth.value !== process.env.ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    try {
        const res = await fetch(
            `${STRAPI_URL}/bigliettos?pagination[limit]=1000&sort=createdAt:desc`,
            {
                headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
                cache: 'no-store',
            }
        )
        const data = await res.json()
        const biglietti = data.data || []

        const oggi = new Date().toDateString()

        const stats = {
            totale: biglietti.length,
            incasso: biglietti.reduce((acc: number, b: any) => acc + (b.prezzo || 0), 0),
            volkswagen: biglietti.filter((b: any) => b.tipo === 'volkswagen').length,
            standard: biglietti.filter((b: any) => b.tipo === 'standard').length,
            pagati: biglietti.filter((b: any) => b.stato === 'pagato').length,
            usati: biglietti.filter((b: any) => b.stato === 'usato').length,
            passeggeri: biglietti.reduce((acc: number, b: any) => acc + (parseInt(b.n_passeggeri) || 0), 0),
            oggi: biglietti.filter((b: any) => new Date(b.createdAt).toDateString() === oggi).length,
            paypal: biglietti.filter((b: any) => b.metodo_pagamento === 'paypal').length,
            contanti: biglietti.filter((b: any) => b.metodo_pagamento === 'contanti').length,
            bonifico: biglietti.filter((b: any) => b.metodo_pagamento === 'bonifico').length,
            associati: biglietti.filter((b: any) => b.metodo_pagamento === 'associato').length,
        }

        return NextResponse.json({ biglietti, stats })
    } catch {
        return NextResponse.json({ error: 'Errore server' }, { status: 500 })
    }
}