import { NextRequest, NextResponse } from 'next/server'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL
const ADMIN_TOKEN = process.env.ADMIN_TOKEN

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const auth = req.cookies.get('admin_auth')
  if (!auth || auth.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const { documentId } = await params
    const body = await req.json()

    // Cerca il biglietto per uuid per ottenere il documentId reale di Strapi
    const search = await fetch(
      `${STRAPI_URL}/bigliettos?filters[uuid][$eq]=${documentId}`,
      { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
    )
    const searchData = await search.json()
    if (!searchData.data?.length) {
      return NextResponse.json({ error: 'Biglietto non trovato' }, { status: 404 })
    }

    const strapiDocumentId = searchData.data[0].documentId

    const res = await fetch(`${STRAPI_URL}/bigliettos/${strapiDocumentId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: body }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}