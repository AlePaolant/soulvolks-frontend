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
    create: (options: { purchase_units: { amount: { currency_code: string; value: string } }[] }) => Promise<string>
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

const STEPS = ['form', 'upload', 'payment', 'done'] as const
type Step = typeof STEPS[number]
const STEP_LABELS: Record<Step, string> = {
  form: 'I tuoi dati',
  upload: 'Le foto',
  payment: 'Pagamento',
  done: 'Fatto',
}

export default function ConcorsoPage() {
  const [step, setStep] = useState<Step>('form')
  const [entryId, setEntryId] = useState<number | null>(null)
  const [entryDocId, setEntryDocId] = useState<string | null>(null)
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
    if (!captchaToken) { setError('Completa la verifica di sicurezza'); return }
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
      setEntryDocId(data.documentId)
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
          actions.order.create({ purchase_units: [{ amount: { currency_code: 'EUR', value: '10.00' } }] }),
        onApprove: async (_data, actions) => {
          const order = await actions.order.capture()
          setLoading(true)
          const res = await fetch('/api/concorso/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entryId: entryDocId, paypalOrderId: order.id }),
          })
          setStep(res.ok ? 'done' : 'payment')
          if (!res.ok) setError('Verifica pagamento fallita, contattaci a info@soulvolks.it')
          setLoading(false)
        },
      }).render('#paypal-button-container')
    }
    document.body.appendChild(script)
  }, [step, entryDocId])

  const stepIndex = STEPS.indexOf(step)

  return (
    <main className="page">
      <div className="hero">
        <span className="eyebrow">Photography Contest</span>
        <h1>Racconti visivi<br />del Volks Camp 2026</h1>
        <p className="dates">7 · 8 · 9 agosto 2026 — Campitello Matese</p>
      </div>

      {step !== 'done' && (
        <ol className="stepper">
          {STEPS.filter(s => s !== 'done').map((s, i) => (
            <li key={s} className={i === stepIndex ? 'active' : i < stepIndex ? 'complete' : ''}>
              <span className="dot">{i < stepIndex ? '✓' : i + 1}</span>
              {STEP_LABELS[s]}
            </li>
          ))}
        </ol>
      )}

      <div className="card">
        {error && <p className="error">{error}</p>}

        {step === 'form' && (
          <form onSubmit={handleRegister}>
            <details className="regolamento" open>
              <summary>Regolamento e premi</summary>
              <div className="reg-body">
                <p>
                  L&apos;Associazione <strong>Soul Volks</strong> organizza il Concorso Fotografico
                  &laquo;Racconti visivi del Matese Volks Camp 2026&raquo;, in occasione del raduno
                  nazionale di auto d&apos;epoca Volkswagen a Campitello Matese dal 7 al 9 agosto 2026.
                </p>
                <p>
                  Aperto a fotografi amatori e professionisti. Saranno ammesse solo foto scattate nei
                  giorni <strong>7, 8 e 9 agosto 2026</strong>.
                </p>

                <h3>Modalità</h3>
                <ul>
                  <li>Partecipazione riservata ai maggiorenni</li>
                  <li>Quota d&apos;iscrizione <strong>€10,00</strong> tramite PayPal</li>
                  <li>Massimo <strong>4 fotografie</strong> in JPG (min. 3000px lato lungo, max 10MB l&apos;una)</li>
                  <li>Niente foto da drone o generate da IA</li>
                  <li>Scadenza invio: <strong>31 agosto 2026</strong></li>
                </ul>

                <h3>Premi</h3>
                <ul className="premi">
                  <li><span className="rank">1°</span> Macchina fotografica Nikon F-401X</li>
                  <li><span className="rank">2°</span> Caciocavallo &laquo;Vecchiarelli&raquo; Guardiaregia</li>
                  <li><span className="rank">3°</span> Olio EVO Biologico Zappacosta</li>
                  <li><span className="rank">★</span> Premio giuria — Bottiglia di Franciacorta</li>
                  <li><span className="rank">★</span> Premio paesaggio — Kit Pasta &laquo;Testa&raquo;</li>
                  <li><span className="rank">★</span> Premio originalità — Felpa Soul Volks</li>
                </ul>

                <p className="small">
                  Giuria anonima, giudizio insindacabile. Mostra e premiazione presso &laquo;Vento Bar&raquo;
                  Ferrazzano. L&apos;autore conserva la titolarità delle opere; concede all&apos;organizzazione
                  un diritto non esclusivo e gratuito per documentazione, promozione, mostre e social media
                  legati all&apos;edizione 2026. Nessun uso commerciale senza consenso scritto.
                </p>
              </div>
            </details>

            <label className="consenso">
              <input type="checkbox" checked={consenso} onChange={e => setConsenso(e.target.checked)} />
              <span>Ho letto e accetto il regolamento e la privacy policy</span>
            </label>

            <div className="fields">
              <div className="field">
                <label>Nome</label>
                <input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="field">
                <label>Cognome</label>
                <input required value={form.cognome} onChange={e => setForm({ ...form, cognome: e.target.value })} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="field">
                <label>Telefono</label>
                <input required value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
              </div>
              <div className="field full">
                <label>Note <span className="opt">(opzionale)</span></label>
                <textarea rows={3} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
              </div>
            </div>

            <div id="turnstile-widget" className="turnstile" />

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Invio in corso…' : 'Continua'}
            </button>
          </form>
        )}

        {step === 'upload' && (
          <form onSubmit={handleUpload}>
            <h2>Carica le tue foto</h2>
            <p className="hint">Fino a 4 foto, formato JPG, min. 3000px lato lungo, max 10MB ciascuna.</p>
            <div className="foto-grid">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`foto-slot ${foto[i] ? 'filled' : ''}`}>
                  <label className="dropzone">
                    <input
                      type="file"
                      accept="image/jpeg"
                      onChange={e => {
                        const nf = [...foto]; nf[i] = e.target.files?.[0] || null; setFoto(nf)
                      }}
                    />
                    {foto[i]
                      ? <span className="filename">📷 {foto[i]!.name}</span>
                      : <span>+ Foto {i + 1}</span>}
                  </label>
                  <input
                    className="titolo-input"
                    placeholder="Titolo (opzionale)"
                    value={titoli[i]}
                    onChange={e => { const nt = [...titoli]; nt[i] = e.target.value; setTitoli(nt) }}
                  />
                </div>
              ))}
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Caricamento…' : 'Continua al pagamento'}
            </button>
          </form>
        )}

        {step === 'payment' && (
          <div className="payment">
            <h2>Completa l&apos;iscrizione</h2>
            <p className="quota">Quota di partecipazione <strong>€10,00</strong></p>
            <div id="paypal-button-container" />
            {loading && <p className="hint">Verifica pagamento in corso…</p>}
          </div>
        )}

        {step === 'done' && (
          <div className="done">
            <span className="check">✓</span>
            <h2>Iscrizione completata!</h2>
            <p>Grazie per aver partecipato al concorso. Riceverai una conferma via email.</p>
            <p className="small">In bocca al lupo per il Volks Camp 2026 🚐</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .page {
          background: #8a9683;
          min-height: 100vh;
          padding: 2.5rem 1.25rem 4rem;
          font-family: Georgia, 'Times New Roman', serif;
          color: #2b2b2b;
        }
        .hero { max-width: 680px; margin: 0 auto 1.5rem; text-align: left; }
        .eyebrow {
          font-family: Arial, sans-serif;
          letter-spacing: 0.25em;
          font-size: 0.72rem;
          color: #f5f3ec;
          text-transform: uppercase;
          display: inline-block;
          margin-bottom: 0.4rem;
        }
        h1 { color: #e2572b; font-size: 2.1rem; line-height: 1.15; margin: 0 0 0.4rem; text-transform: uppercase; }
        .dates {
          font-family: Arial, sans-serif;
          color: #f5f3ec;
          font-size: 0.95rem;
          letter-spacing: 0.03em;
          margin: 0;
        }
        .stepper {
          max-width: 680px;
          margin: 0 auto 1.25rem;
          display: flex;
          list-style: none;
          padding: 0;
          gap: 0.5rem;
          font-family: Arial, sans-serif;
        }
        .stepper li {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;
          color: #eae7dc;
          opacity: 0.6;
        }
        .stepper li.active, .stepper li.complete { opacity: 1; }
        .stepper .dot {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: #f5f3ec;
          color: #2b2b2b;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.72rem; font-weight: bold;
          flex-shrink: 0;
        }
        .stepper li.active .dot { background: #e2572b; color: white; }
        .stepper li.complete .dot { background: #3f5b3f; color: white; }
        .card {
          max-width: 680px;
          margin: 0 auto;
          background: #f5f3ec;
          border-radius: 6px;
          padding: 1.75rem 2rem 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.18);
          border-top: 5px solid #e2572b;
        }
        .regolamento { font-family: Arial, sans-serif; margin-bottom: 1rem; }
        .regolamento summary {
          cursor: pointer;
          font-weight: bold;
          color: #e2572b;
          text-transform: uppercase;
          font-size: 0.95rem;
          padding: 0.3rem 0;
        }
        .reg-body { font-size: 0.9rem; line-height: 1.55; padding-top: 0.5rem; }
        .reg-body h3 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.03em; margin: 1rem 0 0.4rem; }
        .reg-body ul { margin: 0.3rem 0; padding-left: 1.1rem; }
        .reg-body li { margin-bottom: 0.25rem; }
        .premi { list-style: none; padding: 0; }
        .premi li { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; }
        .rank {
          background: #e2572b; color: white; font-weight: bold;
          border-radius: 4px; padding: 0.1rem 0.5rem; font-size: 0.75rem; flex-shrink: 0;
        }
        .small { font-size: 0.82rem; color: #666; }
        .consenso {
          display: flex; align-items: flex-start; gap: 0.6rem;
          font-family: Arial, sans-serif; font-size: 0.88rem;
          background: #eae7dc; border-radius: 5px;
          padding: 0.8rem 1rem; margin: 1.2rem 0;
        }
        .consenso input { margin-top: 0.15rem; }
        .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; font-family: Arial, sans-serif; }
        .field { display: flex; flex-direction: column; gap: 0.3rem; }
        .field.full { grid-column: 1 / -1; }
        .field label { font-size: 0.78rem; font-weight: bold; color: #444; }
        .field .opt { font-weight: normal; color: #888; }
        input, textarea {
          font-family: Arial, sans-serif;
          padding: 0.6rem 0.7rem;
          border: 1px solid #cfc9ba;
          border-radius: 5px;
          font-size: 0.92rem;
          background: white;
        }
        input:focus, textarea:focus { outline: 2px solid #e2572b; outline-offset: 1px; }
        .turnstile { margin: 1.3rem 0 0.5rem; }
        .btn-primary {
          background: #e2572b; color: white; border: none;
          padding: 0.85rem 1.6rem; border-radius: 5px;
          font-family: Arial, sans-serif; font-weight: bold;
          text-transform: uppercase; letter-spacing: 0.04em;
          cursor: pointer; margin-top: 1.2rem; width: 100%;
        }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .error {
          font-family: Arial, sans-serif; background: #fde2e2; color: #a02020;
          padding: 0.7rem 0.9rem; border-radius: 5px; font-size: 0.88rem; margin-bottom: 1rem;
        }
        h2 { color: #e2572b; text-transform: uppercase; font-size: 1.15rem; margin-top: 0; }
        .hint { font-family: Arial, sans-serif; font-size: 0.85rem; color: #666; }
        .foto-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; margin: 1rem 0 0.5rem; }
        .foto-slot { display: flex; flex-direction: column; gap: 0.4rem; }
        .dropzone {
          border: 2px dashed #cfc9ba;
          border-radius: 6px;
          padding: 1.4rem 0.6rem;
          text-align: center;
          font-family: Arial, sans-serif;
          font-size: 0.85rem;
          color: #888;
          cursor: pointer;
          background: white;
          transition: border-color 0.15s;
        }
        .foto-slot.filled .dropzone { border-color: #3f5b3f; color: #3f5b3f; }
        .dropzone input { display: none; }
        .filename { word-break: break-all; }
        .titolo-input { font-size: 0.82rem; padding: 0.4rem 0.6rem; }
        .payment { text-align: center; }
        .quota { font-family: Arial, sans-serif; font-size: 1rem; margin-bottom: 1.2rem; }
        .done { text-align: center; padding: 1.5rem 0; }
        .check {
          display: inline-flex; align-items: center; justify-content: center;
          width: 56px; height: 56px; border-radius: 50%;
          background: #3f5b3f; color: white; font-size: 1.8rem;
          margin-bottom: 1rem;
        }
        .done p { font-family: Arial, sans-serif; }
        @media (max-width: 560px) {
          .fields { grid-template-columns: 1fr; }
          .foto-grid { grid-template-columns: 1fr; }
          .stepper li span:not(.dot) { display: none; }
        }
      `}</style>
    </main>
  )
}