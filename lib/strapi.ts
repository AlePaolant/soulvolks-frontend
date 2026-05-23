const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1338/api'

export async function fetchAPI(path: string, options = {}) {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function createBiglietto(data: any) {
  const res = await fetch(`${STRAPI_URL}/biglietti`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify({ data }),
  })
  if (!res.ok) throw new Error(`Errore creazione biglietto: ${res.status}`)
  return res.json()
}
