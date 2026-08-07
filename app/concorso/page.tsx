'use client'

import { useState, useEffect } from 'react'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

interface TurnstileInstance {
  render: (selector: string, options: { sitekey: string; callback: (token: string) => void }) => void
}

interface PayPalOrderActions {
  order: {
    create: (options: {
      purchase_units: { amount: { currency_code: string; value: string } }[]
    }) => Promise<string>
    capture: () => Promise<{ id: string }>
  }
}

interface PayPalNamespace {
  Buttons: (options: {
    createOrder: (data: unknown, actions: PayPalOrderActions) => Promise<string>
    onApprove: (data: unknown, actions: PayPalOrderActions) => Promise<void>
  }) => { render: (selector: string) => void }
}

function getTurnstile(): TurnstileInstance | undefined {
  return (window as unknown as { turnstile?: TurnstileInstance }).turnstile
}

function getPayPal(): PayPalNamespace | undefined {
  return (window as unknown as { paypal?: PayPalNamespace }).paypal
}

export default function ConcorsoPage() {
  const [step, setStep] = useState<'form' | 'upload' | 'payment' | 'done'>('form')
  const [entryId, setEntryId] = useState<number | null>(null)
  const [captchaToken, setCaptchaToken] = useState('')
  const [consenso, setConsenso] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ nome: '', cognome: '', email: '', telefono: '', note: '' })
  const [foto, setFoto] = useState<(File | null)[]>([null, null, null, null])
  const [titoli, setTitoli] = useState(['', '', '', ''])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  useEffect(() => {
    if (step !== 'form') return
    const interval = setInterval(() => {
      const turnstile = getTurnstile()
      if (turnstile) {
        clearInterval(interval)
        turnstile.render('#turnstile-widget', {
          sitekey: TURNSTILE_SITE_KEY || '',
          callback: (token: string) => setCaptchaToken(token),
        })
      }
    }, 300)
    return () => clearInterval(interval)
  }, [step])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!consenso) { setError('Devi accettare regolamento e privacy policy'); return }
    if (!captchaToken) { setError('Completa la verifica captcha'); return }
    setLoading(true)
    try {
      const res = await fetch(`${STRAPI_URL}/concorso/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, consensoAccettato: true, captchaToken }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error?.message || 'Errore durante la registrazione'); setLoading(false); return }
      setEntryId(data.id)
      setStep('upload')
    } catch {
      setError('Errore di connessione, riprova')
    }
    setLoading(false)
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const filesSelected = foto.filter(Boolean)
    if (filesSelected.length === 0) { setError('Carica almeno una foto'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      foto.forEach((f, i) => { if (f) fd.append(`foto${i + 1}`, f) })
      titoli.forEach((t, i) => { fd.append(`titolo${i + 1}`, t) })
      const res = await fetch(`${STRAPI_URL}/concorso/${entryId}/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error?.message || 'Errore durante il caricamento'); setLoading(false); return }
      setStep('payment')
    } catch {
      setError('Errore di connessione, riprova')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (step !== 'payment') return
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=EUR`
    script.async = true
    script.onload = () => {
      const paypal = getPayPal()
      if (!paypal) return
      paypal.Buttons({
        createOrder: (_data, actions) =>
          actions.order.create({
            purchase_units: [{ amount: { currency_code: 'EUR', value: '10.00' } }],
          }),
        onApprove: async (_data, actions) => {
          const order = await actions.order.capture()
          setLoading(true)
          const res = await fetch('/api/concorso/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entryId, paypalOrderId: order.id }),
          })
          setStep(res.ok ? 'done' : 'payment')
          if (!res.ok) setError('Verifica pagamento fallita, contattaci')
          setLoading(false)
        },
      }).render('#paypal-button-container')
    }
    document.body.appendChild(script)
  }, [step])
  
  return (
    <main className="concorso-page">
      <div className="header">
        <span className="badge">Photography Contest</span>
        <h1>Racconti visivi<br />del Volks Camp 2026</h1>
      </div>

      <div className="card">
        {error && <p className="error">{error}</p>}

        {step === 'form' && (
          <form onSubmit={handleRegister}>
            <section className="regolamento">
              <h2>Regolamento generale</h2>
              <p>
                L&apos;Associazione <strong>Soul Volks</strong> organizza il Concorso Fotografico
                &laquo;Racconti visivi del Matese Volks Camp 2026&raquo;, in occasione del raduno nazionale
                di auto d&apos;epoca Volkswagen che si terrà a Campitello Matese dal 7 al 9 agosto 2026.
              </p>
              <p>
                Il concorso è aperto a fotografi amatori e professionisti e ha l&apos;obiettivo di raccontare,
                attraverso le immagini, l&apos;atmosfera dell&apos;evento: auto d&apos;epoca, paesaggi, concerti,
                mercatini, campeggio e tutto ciò che rende unico il Volks Camp 2026. Saranno ammesse al concorso
                solo le foto scattate nei giorni <strong>7, 8 e 9 agosto 2026</strong>.
              </p>

              <h3>Modalità di partecipazione</h3>
              <ul>
                <li>La partecipazione è riservata ai maggiorenni.</li>
                <li>Quota d&apos;iscrizione: <strong>€10,00</strong>, da versare tramite PayPal in fase di iscrizione.</li>
                <li>Invio massimo: <strong>4 fotografie</strong> digitali in formato JPG (min. 3000px lato lungo, max 10MB per file).</li>
                <li>Non sono ammesse fotografie scattate da droni o generate da intelligenza artificiale.</li>
                <li>Post-produzione leggera consentita (luminosità, contrasto, ecc.).</li>
                <li>Scadenza invio: <strong>31 agosto 2026</strong>.</li>
              </ul>

              <h3>Premi</h3>
              <ul className="premi">
                <li><strong>1° classificato:</strong> Macchina fotografica Nikon F-401X</li>
                <li><strong>2° classificato:</strong> Caciocavallo &laquo;Vecchiarelli&raquo; Guardiaregia</li>
                <li><strong>3° classificato:</strong> Bottiglia di Olio Extra Vergine di Oliva Biologico Zappacosta</li>
                <li><strong>Premio speciale giuria:</strong> Bottiglia di Franciacorta</li>
                <li><strong>Premio speciale paesaggio:</strong> Kit Pasta Artigianale &laquo;Testa&raquo;</li>
                <li><strong>Premio speciale originalità:</strong> Felpa Soul Volks</li>
              </ul>
              <p>
                Le foto saranno valutate da una giuria anonima composta da fotografi professionisti,
                membri dell&apos;organizzazione e personalità del settore culturale. Il giudizio della
                giuria è insindacabile. Mostra e premiazioni presso &laquo;Vento Bar&raquo; Ferrazzano.
              </p>

              <h3>Utilizzo delle immagini</h3>
              <p>
                L&apos;autore conserva la titolarità delle opere, ma concede all&apos;organizzazione un
                diritto non esclusivo e gratuito per documentazione e promozione dell&apos;edizione 2026,
                futuri materiali di comunicazione cartacei e digitali, mostre, sito e social media, e uso
                interno per attività culturali dell&apos;associazione. Nessun utilizzo commerciale sarà
                effettuato senza consenso scritto dell&apos;autore.
              </p>

              <h3>Liberatoria e responsabilità</h3>
              <p>
                L&apos;autore garantisce di essere l&apos;unico titolare dei diritti sulle immagini
                inviate, che le foto non ledono diritti di terzi né violano leggi vigenti, e di avere
                il consenso di eventuali soggetti riconoscibili nelle immagini.
              </p>
            </section>

            <label className="consenso">
              <input type="checkbox" checked={consenso} onChange={e => setConsenso(e.target.checked)} />
              Ho letto e accetto il regolamento e la privacy policy
            </label>

            <h2>I tuoi dati</h2>
            <div className="fields">
              <input placeholder="Nome" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
              <input placeholder="Cognome" required value={form.cognome} onChange={e => setForm({ ...form, cognome: e.target.value })} />
              <input placeholder="Email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input placeholder="Telefono" required value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
              <textarea placeholder="Note (opzionale)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>

            <div id="turnstile-widget" className="turnstile" />

            <button type="submit" disabled={loading}>{loading ? 'Invio...' : 'Continua'}</button>
          </form>
        )}

        {step === 'upload' && (
          <form onSubmit={handleUpload}>
            <h2>Carica le tue foto</h2>
            <p className="hint">Massimo 4 foto, formato JPG, min. 3000px lato lungo, max 10MB ciascuna.</p>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="foto-row">
                <input type="file" accept="image/jpeg" onChange={e => {
                  const nf = [...foto]; nf[i] = e.target.files?.[0] || null; setFoto(nf)
                }} />
                <input placeholder="Titolo (opzionale)" value={titoli[i]} onChange={e => {
                  const nt = [...titoli]; nt[i] = e.target.value; setTitoli(nt)
                }} />
              </div>
            ))}
            <button type="submit" disabled={loading}>{loading ? 'Caricamento...' : 'Continua al pagamento'}</button>
          </form>
        )}

        {step === 'payment' && (
          <div className="payment">
            <h2>Completa l&apos;iscrizione</h2>
            <p>Quota di partecipazione: <strong>€10,00</strong></p>
            <div id="paypal-button-container" />
            {loading && <p>Verifica pagamento in corso...</p>}
          </div>
        )}

        {step === 'done' && (
          <div className="done">
            <h2>Iscrizione completata!</h2>
            <p>Grazie per aver partecipato. Riceverai una conferma via email.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .concorso-page {
          background: #8a9683;
          min-height: 100vh;
          padding: 3rem 1.5rem;
          font-family: Georgia, 'Times New Roman', serif;
          color: #2b2b2b;
        }
        .header { max-width: 640px; margin: 0 auto 2rem; }
        .badge {
          display: inline-block;
          font-family: Arial, sans-serif;
          letter-spacing: 0.2em;
          font-size: 0.75rem;
          color: #f5f3ec;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        h1 {
          color: #e2572b;
          font-size: 2.2rem;
          line-height: 1.15;
          margin: 0;
          text-transform: uppercase;
        }
        .card {
          max-width: 640px;
          margin: 0 auto;
          background: #f5f3ec;
          border-radius: 4px;
          padding: 2rem;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        h2 { color: #e2572b; text-transform: uppercase; font-size: 1.1rem; margin-top: 1.5rem; }
        h3 { color: #2b2b2b; font-size: 1rem; margin-top: 1.2rem; text-transform: uppercase; letter-spacing: 0.03em; }
        .regolamento p, .regolamento li { font-family: Arial, sans-serif; font-size: 0.92rem; line-height: 1.5; }
        .premi li { margin-bottom: 0.3rem; }
        .consenso {
          display: flex; align-items: center; gap: 0.5rem;
          font-family: Arial, sans-serif; font-size: 0.9rem;
          margin: 1.5rem 0; padding: 0.8rem; background: #eae7dc; border-radius: 4px;
        }
        .fields { display: flex; flex-direction: column; gap: 0.7rem; }
        input, textarea {
          font-family: Arial, sans-serif;
          padding: 0.6rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 0.95rem;
        }
        .turnstile { margin: 1rem 0; }
        button {
          background: #e2572b;
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 4px;
          font-family: Arial, sans-serif;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          margin-top: 1rem;
        }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .error {
          font-family: Arial, sans-serif;
          background: #fde2e2; color: #a02020;
          padding: 0.7rem; border-radius: 4px; font-size: 0.9rem;
        }
        .hint { font-family: Arial, sans-serif; font-size: 0.85rem; color: #666; }
        .foto-row { display: flex; gap: 0.7rem; margin-bottom: 0.8rem; }
        .foto-row input[type="text"], .foto-row input:not([type="file"]) { flex: 1; }
      `}</style>
    </main>
  )
}