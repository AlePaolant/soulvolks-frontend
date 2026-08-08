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
    form: 'I tuoi dati', upload: 'Le foto', payment: 'Pagamento', done: 'Fatto',
}

export default function ConcorsoPage() {
    const [step, setStep] = useState<Step>('form')
    const [entryId, setEntryId] = useState<number | null>(null)
    const [entryDocId, setEntryDocId] = useState<string | null>(null)
    const [captchaToken, setCaptchaToken] = useState('')
    const [consenso, setConsenso] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [manualChoice, setManualChoice] = useState<'contanti' | 'bonifico' | null>(null)

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
        if (step !== 'payment' || manualChoice) return
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
    }, [step, entryDocId, manualChoice])

    async function scegliPagamentoManuale(metodo: 'contanti' | 'bonifico') {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/concorso/manual-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entryId, metodo, ...form }),
            })
            if (!res.ok) { setError('Errore, riprova'); setLoading(false); return }
            setManualChoice(metodo)
        } catch {
            setError('Errore di connessione, riprova')
        }
        setLoading(false)
    }

    const stepIndex = STEPS.indexOf(step)
    const visibleSteps = STEPS.filter(s => s !== 'done')

    return (
        <main className="page">
            <div className="hero">
                <span className="eyebrow">Photography Contest</span>
                <h1>Racconti visivi del Volks Camp 2026</h1>
                <p className="dates">7 · 8 · 9 agosto 2026 — Campitello Matese</p>
            </div>

            {step !== 'done' && (
                <nav className="stepper" aria-label="Avanzamento iscrizione">
                    {visibleSteps.map((s, i) => (
                        <div key={s} className="stepper-item-wrap">
                            <div className={`stepper-item ${i === stepIndex ? 'active' : i < stepIndex ? 'complete' : ''}`}>
                                <span className="dot">{i < stepIndex ? '✓' : i + 1}</span>
                                <span className="label">{STEP_LABELS[s]}</span>
                            </div>
                            {i < visibleSteps.length - 1 && (
                                <span className={`connector ${i < stepIndex ? 'complete' : ''}`} />
                            )}
                        </div>
                    ))}
                </nav>
            )}

            <div className="card">
                {error && <p className="error">{error}</p>}

                {step === 'form' && (
                    <form onSubmit={handleRegister}>
                        <details className="regolamento">
                            <summary>
                                <span className="summary-arrow">▸</span> Regolamento e premi
                            </summary>
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
                                    <li>Quota d&apos;iscrizione <strong>€10,00</strong></li>
                                    <li>Massimo <strong>4 fotografie</strong> in JPG (min. 3000px lato lungo, max 10MB l&apos;una)</li>
                                    <li>Niente foto da drone o generate da IA</li>
                                    <li>Scadenza invio: <strong>31 agosto 2026</strong></li>
                                </ul>
                                <h3>Premi</h3>
                                <ul className="premi">
                                    <li><span className="rank">1°</span> Macchina fotografica Nikon F-401X</li>
                                    <li><span className="rank">2°</span> Caciocavallo &laquo;Vecchiarelli&raquo; Guardiaregia</li>
                                    <li><span className="rank">3°</span> Olio EVO Biologico Zappacosta</li>
                                    <li><span className="rank star">★</span> Premio giuria — Bottiglia di Franciacorta</li>
                                    <li><span className="rank star">★</span> Premio paesaggio — Kit Pasta &laquo;Testa&raquo;</li>
                                    <li><span className="rank star">★</span> Premio originalità — Felpa Soul Volks</li>
                                </ul>
                                <p className="small">
                                    Giuria anonima, giudizio insindacabile. Mostra e premiazione presso &laquo;Vento Bar&raquo;
                                    Ferrazzano. L&apos;autore conserva la titolarità delle opere; concede all&apos;organizzazione
                                    un diritto non esclusivo e gratuito per documentazione, promozione, mostre e social media
                                    legati all&apos;edizione 2026.
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
                                            onChange={e => { const nf = [...foto]; nf[i] = e.target.files?.[0] || null; setFoto(nf) }}
                                        />
                                        {foto[i]
                                            ? <span className="filename">✓ {foto[i]!.name}</span>
                                            : <span className="placeholder">＋ Foto {i + 1}</span>}
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

                {step === 'payment' && !manualChoice && (
                    <div className="payment">
                        <h2>Completa l&apos;iscrizione</h2>
                        <p className="quota">Quota di partecipazione <strong>€10,00</strong></p>
                        <div id="paypal-button-container" />
                        {loading && <p className="hint">Verifica pagamento in corso…</p>}

                        <div className="divider"><span>oppure</span></div>

                        <p className="hint">Preferisci pagare di persona o con bonifico?</p>
                        <div className="manual-options">
                            <button type="button" className="btn-secondary" disabled={loading} onClick={() => scegliPagamentoManuale('contanti')}>
                                Contanti all&apos;evento
                            </button>
                            <button type="button" className="btn-secondary" disabled={loading} onClick={() => scegliPagamentoManuale('bonifico')}>
                                Bonifico bancario
                            </button>
                        </div>
                    </div>
                )}

                {step === 'payment' && manualChoice && (
                    <div className="payment manual-confirmed">
                        <span className="check">✓</span>
                        <h2>Quasi fatto!</h2>
                        {manualChoice === 'contanti' ? (
                            <p>La tua iscrizione è registrata. Paga <strong>€10,00 in contanti</strong> allo stand Soul Volks entro <strong>48 ore</strong> per confermare la partecipazione.</p>
                        ) : (
                            <>
                                <p>La tua iscrizione è registrata. Effettua un bonifico di <strong>€10,00</strong> entro <strong>7 giorni</strong> per confermare la partecipazione (considera i tempi bancari):</p>                <div className="iban-box">
                                    <p className="iban-label">IBAN</p>
                                    <p className="iban-value">IT67 F052 6203 802C C140 0002 078</p>
                                    <p className="iban-label">Intestato a</p>
                                    <p className="iban-value">Soul Volks aps</p>
                                    <p className="iban-label">Causale</p>
                                    <p className="iban-value">Concorso foto — {form.nome} {form.cognome}</p>
                                </div>
                            </>
                        )}
                        <p className="small">
                            {manualChoice === 'bonifico'
                                ? 'Se il pagamento non risulta entro 7 giorni, l\'iscrizione verrà annullata automaticamente.'
                                : 'Se il pagamento non risulta entro 48 ore, l\'iscrizione verrà annullata automaticamente.'}
                        </p>
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

            <footer className="site-footer">
                <p>Soul Volks Club — Molise, Italia · Est. 2023</p>
                <p className="credits">Powered by Civico32 Studio &amp; AP</p>
            </footer>

            <style jsx>{`
        * { box-sizing: border-box; }
        .page {
          background: linear-gradient(180deg, #8a9683 0%, #7d8a76 100%);
          min-height: 100vh;
          padding: 3rem 1.25rem 3.5rem;
          font-family: Georgia, 'Times New Roman', serif;
          color: #2b2b2b;
        }
        .hero { max-width: 620px; margin: 0 auto 2rem; }
        .eyebrow {
          font-family: Arial, sans-serif;
          letter-spacing: 0.25em;
          font-size: 0.7rem;
          color: #f5f3ec;
          text-transform: uppercase;
          display: inline-block;
          margin-bottom: 0.6rem;
          opacity: 0.85;
        }
        h1 {
          color: #f4e9dd;
          font-size: 2rem;
          line-height: 1.25;
          margin: 0 0 0.7rem;
          text-transform: uppercase;
          text-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }
        .dates {
          font-family: Arial, sans-serif;
          color: #f5f3ec;
          font-size: 0.9rem;
          letter-spacing: 0.02em;
          margin: 0;
          opacity: 0.9;
        }

        .stepper {
          max-width: 620px;
          margin: 0 auto 0;
          display: flex;
          align-items: center;
          font-family: Arial, sans-serif;
        }
        .stepper-item-wrap {
          display: flex;
          align-items: center;
          flex: 1;
        }
        .stepper-item-wrap:last-child { flex: 0 0 auto; }
        .stepper-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          opacity: 0.55;
          white-space: nowrap;
        }
        .stepper-item.active, .stepper-item.complete { opacity: 1; }
        .dot {
          width: 30px; height: 30px;
          border-radius: 50%;
          background: rgba(245,243,236,0.9);
          color: #2b2b2b;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.78rem; font-weight: bold;
          flex-shrink: 0;
        }
        .stepper-item.active .dot { background: #e2572b; color: white; }
        .stepper-item.complete .dot { background: #46603f; color: white; }
        .stepper-item .label {
          font-size: 0.8rem;
          color: #f5f3ec;
          font-weight: 600;
        }
        .connector {
          height: 2px;
          flex: 1;
          background: rgba(245,243,236,0.35);
          margin: 0 0.6rem;
          min-width: 20px;
        }
        .connector.complete { background: #46603f; }

        .card {
          max-width: 620px;
          margin: 1.5rem auto 0;
          background: #faf8f3;
          border-radius: 14px;
          padding: 2rem 2.1rem 2.2rem;
          box-shadow: 0 20px 45px rgba(0,0,0,0.22);
        }
        .regolamento { font-family: Arial, sans-serif; margin-bottom: 1.4rem; }
        .regolamento summary {
          cursor: pointer;
          list-style: none;
          font-weight: 700;
          color: #e2572b;
          text-transform: uppercase;
          font-size: 0.88rem;
          letter-spacing: 0.02em;
          padding: 0.9rem 1rem;
          background: #fdf1ea;
          border-radius: 9px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .regolamento summary::-webkit-details-marker { display: none; }
        .summary-arrow { transition: transform 0.15s; display: inline-block; }
        .regolamento[open] .summary-arrow { transform: rotate(90deg); }
        .reg-body { font-size: 0.9rem; line-height: 1.6; padding: 1.1rem 0.3rem 0.2rem; color: #3a3a3a; }
        .reg-body h3 {
          font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em;
          margin: 1.2rem 0 0.5rem; color: #46603f;
        }
        .reg-body ul { margin: 0.3rem 0; padding-left: 1.2rem; }
        .reg-body li { margin-bottom: 0.35rem; }
        .premi { list-style: none; padding: 0; }
        .premi li { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.45rem; }
        .rank {
          background: #e2572b; color: white; font-weight: bold;
          border-radius: 5px; width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.72rem; flex-shrink: 0;
        }
        .rank.star { background: #46603f; }
        .small { font-size: 0.8rem; color: #777; margin-top: 0.9rem; }

        .consenso {
          display: flex; align-items: flex-start; gap: 0.65rem;
          font-family: Arial, sans-serif; font-size: 0.87rem;
          background: #eef0e6; border-radius: 9px;
          padding: 0.9rem 1.05rem; margin: 1.5rem 0 1.6rem;
          border: 1px solid #dde1d1;
        }
        .consenso input { margin-top: 0.18rem; accent-color: #e2572b; }

        .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-family: Arial, sans-serif; }
        .field { display: flex; flex-direction: column; gap: 0.35rem; }
        .field.full { grid-column: 1 / -1; }
        .field label { font-size: 0.76rem; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.03em; }
        .field .opt { font-weight: normal; color: #999; text-transform: none; }
        input, textarea {
          font-family: Arial, sans-serif;
          padding: 0.7rem 0.85rem;
          border: 1.5px solid #e0ddd0;
          border-radius: 8px;
          font-size: 0.93rem;
          background: white;
          color: #2b2b2b;
        }
        input:focus, textarea:focus { outline: none; border-color: #e2572b; box-shadow: 0 0 0 3px rgba(226,87,43,0.12); }
        .turnstile { margin: 1.5rem 0 0.3rem; display: flex; justify-content: center; }

        .btn-primary {
          background: #e2572b; color: white; border: none;
          padding: 0.95rem 1.6rem; border-radius: 9px;
          font-family: Arial, sans-serif; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em;
          font-size: 0.85rem;
          cursor: pointer; margin-top: 1.5rem; width: 100%;
          transition: background 0.15s, transform 0.1s;
          box-shadow: 0 6px 16px rgba(226,87,43,0.3);
        }
        .btn-primary:hover:not(:disabled) { background: #cc4a22; }
        .btn-primary:active:not(:disabled) { transform: scale(0.99); }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }

        .btn-secondary {
          background: white; color: #2b2b2b; border: 1.5px solid #e0ddd0;
          padding: 0.8rem 1rem; border-radius: 8px;
          font-family: Arial, sans-serif; font-weight: 700; font-size: 0.82rem;
          cursor: pointer; flex: 1; transition: border-color 0.15s;
        }
        .btn-secondary:hover:not(:disabled) { border-color: #e2572b; color: #e2572b; }
        .btn-secondary:disabled { opacity: 0.55; cursor: not-allowed; }

        .error {
          font-family: Arial, sans-serif; background: #fdeaea; color: #a5241f;
          border: 1px solid #f4c6c4;
          padding: 0.8rem 1rem; border-radius: 8px; font-size: 0.87rem; margin-bottom: 1.2rem;
        }
        h2 { color: #2b2b2b; text-transform: uppercase; font-size: 1.2rem; margin: 0 0 0.4rem; letter-spacing: 0.01em; }
        .hint { font-family: Arial, sans-serif; font-size: 0.84rem; color: #777; margin: 0.2rem 0 1rem; }

        .foto-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.2rem 0 0.5rem; }
        .foto-slot { display: flex; flex-direction: column; gap: 0.45rem; }
        .dropzone {
          border: 2px dashed #d6d2c2;
          border-radius: 10px;
          padding: 1.6rem 0.7rem;
          text-align: center;
          font-family: Arial, sans-serif;
          font-size: 0.83rem;
          color: #999;
          cursor: pointer;
          background: white;
          transition: border-color 0.15s, background 0.15s;
        }
        .dropzone:hover { border-color: #e2572b; background: #fff8f5; }
        .foto-slot.filled .dropzone { border-color: #46603f; border-style: solid; color: #46603f; background: #f2f6ef; font-weight: 600; }
        .dropzone input { display: none; }
        .filename { word-break: break-all; }
        .placeholder { font-size: 1rem; color: #bbb; }
        .titolo-input { font-size: 0.82rem; padding: 0.5rem 0.7rem; }

        .payment { text-align: center; }
        .quota { font-family: Arial, sans-serif; font-size: 1rem; margin: 0 0 1.4rem; color: #555; }
        .divider { display: flex; align-items: center; text-align: center; margin: 1.6rem 0; font-family: Arial, sans-serif; color: #aaa; font-size: 0.78rem; }
        .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #e5e2d6; }
        .divider span { padding: 0 0.9rem; }
        .manual-options { display: flex; gap: 0.7rem; }
        .manual-confirmed p { font-family: Arial, sans-serif; line-height: 1.55; color: #444; }
        .iban-box {
            background: #eef0e6; border: 1px solid #dde1d1; border-radius: 9px;
            padding: 1rem 1.2rem; margin-top: 1rem; text-align: left;
            font-family: Arial, sans-serif;
        }
        .iban-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: #888; margin: 0.6rem 0 0.1rem; }
        .iban-label:first-child { margin-top: 0; }
        .iban-value { font-size: 0.95rem; font-weight: 700; color: #2b2b2b; margin: 0 0 0.2rem; }
        .done, .manual-confirmed { text-align: center; padding: 1.2rem 0 0.5rem; }
        .check {
          display: inline-flex; align-items: center; justify-content: center;
          width: 58px; height: 58px; border-radius: 50%;
          background: #46603f; color: white; font-size: 1.7rem;
          margin-bottom: 1.1rem;
          box-shadow: 0 8px 20px rgba(70,96,63,0.3);
        }
        .done p { font-family: Arial, sans-serif; color: #444; line-height: 1.5; }

        .site-footer {
          max-width: 620px;
          margin: 2.5rem auto 0;
          text-align: center;
          font-family: Arial, sans-serif;
          color: #f0ede4;
        }
        .site-footer p { margin: 0.2rem 0; font-size: 0.78rem; letter-spacing: 0.03em; opacity: 0.85; }
        .site-footer .credits { opacity: 0.55; font-size: 0.7rem; }

        @media (max-width: 560px) {
          .page { padding: 2rem 1rem 2.5rem; }
          h1 { font-size: 1.6rem; }
          .card { padding: 1.5rem 1.3rem 1.8rem; border-radius: 12px; }
          .fields { grid-template-columns: 1fr; }
          .foto-grid { grid-template-columns: 1fr; }
          .stepper-item .label { display: none; }
          .connector { margin: 0 0.35rem; }
          .manual-options { flex-direction: column; }
        }
      `}</style>
        </main>
    )
}