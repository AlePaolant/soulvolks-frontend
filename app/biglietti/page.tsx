'use client'

import { useState } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { Car, Tent, Users, CreditCard, MapPin, Calendar, CheckCircle } from 'lucide-react'
import Donazione from './donazione'

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb'

type TipoVeicolo = 'volkswagen' | 'standard'

type FormData = {
  nome: string
  cognome: string
  email: string
  telefono: string
  n_passeggeri: string
  targa: string
  tipo: TipoVeicolo
  modello: string
  anno: string
  note: string
}

const inputClass = `
  w-full bg-transparent border-b-2 border-[var(--nero)]/30 
  px-0 py-3 text-[var(--nero)] placeholder-[var(--nero)]/30 
  outline-none focus:border-[var(--rosso)] transition-colors 
  font-poppins text-base
`

const labelClass = `
  block text-[10px] uppercase tracking-[0.2em] 
  ttext-[var(--nero)]/60 mb-1 text-xs
  font-poppins font-medium
`

export default function BigliettiPage() {
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form')
  const [formData, setFormData] = useState<FormData>({
    nome: '', cognome: '', email: '', telefono: '',
    n_passeggeri: '1', targa: '', tipo: 'standard',
    modello: '', anno: '', note: '',
  })
  const [uuid, setUuid] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStep('payment')
  }

  const handlePaymentSuccess = async (orderId: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/biglietti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, paypal_order_id: orderId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUuid(data.uuid)

      await fetch('/api/biglietti/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, uuid: data.uuid, zona: formData.tipo === 'volkswagen' ? 'A' : 'B' }),
      })

      await fetch('/api/biglietti/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, uuid: data.uuid }),
      })

      setStep('success')
    } catch (err: any) {
      setError(err.message || 'Errore durante il pagamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'EUR' }}>
      <main className="min-h-screen bg-[var(--panna)]">

        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="relative bg-[var(--scuro)] overflow-hidden" style={{ minHeight: '85vh' }}>

          {/* Texture grana */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '200px' }} />

          {/* Linea rossa bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[var(--rosso)] z-20" />

          <div className="relative z-10 h-full flex" style={{ minHeight: '85vh' }}>

            {/* COLONNA SX — stretta, verticale */}
            <div className="flex flex-col justify-between py-10 px-6 border-r border-[var(--panna-chiaro)]/10 w-16 md:w-20 shrink-0">
              {/* Logo top */}
              <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                <span className="font-poppins font-black text-[var(--panna-chiaro)] text-md uppercase tracking-[0.3em]">
                  Soul Volks
                </span>
              </div>
              {/* Anno bottom */}
              <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                <span className="font-poppins text-[var(--panna-chiaro)]/60 text-sm tracking-widest">
                  Est. 2023
                </span>
              </div>
            </div>

            {/* COLONNA CENTRO — contenuto principale */}
            <div className="flex-1 flex flex-col justify-between px-8 md:px-12 py-10">

              {/* Top — data e luogo */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-[var(--panna-chiaro)]/50">
                    <Calendar size={11} />
                    <span className="font-poppins text-[14px] uppercase tracking-[0.2em]">7 · 8 · 9 Agosto 2026</span>
                  </div>
                  <div className="w-px h-3 bg-[var(--panna-chiaro)]/10" />
                  <div className="flex items-center gap-2 text-[var(--panna-chiaro)]/50">
                    <MapPin size={11} />
                    <span className="font-poppins text-[14px] uppercase tracking-[0.2em]">Campitello Matese (CB)</span>
                  </div>
                </div>
              </div>

              {/* Centro — titolo gigante */}
              <div className="my-auto py-8">
                <h1 className="font-droid text-[var(--panna-chiaro)] leading-[0.95]"
                  style={{
                    fontSize: 'clamp(4rem, 10vw, 14rem)',
                    textShadow: '6px 6px 0px rgba(225,39,19,0.25)'
                  }}>
                  MATESE<br />
                  <span className="text-[var(--rosso)]">VOLKS</span><br />
                  CAMP
                </h1>
                <p className="font-poppins font-black text-[var(--rosso)] mt-1 tracking-[0.4em]"
                  style={{ fontSize: 'clamp(3.5rem, 2.8vw, 2rem)' }}>
                  2026
                </p>
              </div>

              {/* Bottom — prezzo + descrizione */}
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-poppins text-[15px] uppercase tracking-[0.3em] text-[var(--panna-chiaro)]/80 mb-2">
                    Biglietto unico evento
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className="font-droid text-[var(--rosso)]" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>€20</span>
                    <span className="font-poppins text-[var(--panna-chiaro)]/80 text-lg">/ persona</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 animate-bounce">
                  <p className="font-poppins text-[var(--panna-chiaro)]/60 text-md hidden md:block">
                    PREVENDITA APERTA
                  </p>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-[var(--panna-chiaro)]/60">
                    <path d="M4 7L10 13L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

            </div>

            {/* COLONNA DX — immagine */}
            <div className="hidden md:flex w-2/5 lg:w-1/2 relative shrink-0">
              <img
                src="/img/karman-sfondo2.jpg"
                alt="Karmann Ghia"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>

        </section>
















        {/* ── CONTENUTO PRINCIPALE ─────────────────────────── */}
        <section className="max-w-4xl mx-auto px-8 py-20">

          {/* STEP: FORM */}
          {step === 'form' && (
            <form onSubmit={handleFormSubmit}>

              {/* Scelta tipo veicolo */}
              <div className="mb-16">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-8 h-[2px] bg-[var(--rosso)]" />
                  <span className="font-poppins text-[10px] uppercase tracking-[0.3em] text-[var(--nero)]/60">
                    Passo 1 di 2
                  </span>
                </div>
                <h2 className="font-droid text-[var(--nero)] mb-10"
                  style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', letterSpacing: '-0.03em' }}>
                  CHE AUTO<br />PORTI?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Card Volkswagen */}
                  <button type="button" onClick={() => setFormData({ ...formData, tipo: 'volkswagen' })}
                    className={`relative p-8 border-2 rounded-xl text-left transition-all duration-300 group ${formData.tipo === 'volkswagen'
                      ? 'border-[var(--nero)] bg-[var(--nero)] text-[var(--panna)]'
                      : 'border-[var(--nero)]/20 hover:border-[var(--nero)]/60 bg-white'
                      }`}>
                    <div className={`absolute top-4 right-4 w-3 h-3 rounded-full border-2 ${formData.tipo === 'volkswagen' ? 'bg-[var(--rosso)] border-[var(--rosso)]' : 'border-[var(--nero)]/30'
                      }`} />
                    <Car size={32} className={`mb-6 ${formData.tipo === 'volkswagen' ? 'text-[var(--rosso)]' : 'text-[var(--nero)]/60'}`} />
                    <h3 className="font-poppins font-bold text-xl uppercase tracking-wider mb-2">
                      Volkswagen
                    </h3>
                    <p className={`font-poppins text-sm font-light ${formData.tipo === 'volkswagen' ? 'text-[var(--panna)]/60' : 'text-[var(--nero)]/60'}`}>
                      Maggiolino, Maggiolone, T1, T2, T3 e altri modelli
                    </p>
                    <div className={`mt-6 inline-block px-4 py-1 text-xs uppercase tracking-widest font-poppins font-bold ${formData.tipo === 'volkswagen' ? 'bg-[var(--rosso)] text-white' : 'bg-[var(--nero)]/10 text-[var(--nero)]/50'
                      }`}>
                      Zona A · Parcheggio Dedicato
                    </div>
                  </button>

                  {/* Card Standard */}
                  <button type="button" onClick={() => setFormData({ ...formData, tipo: 'standard' })}
                    className={`relative p-8 border-2 rounded-xl text-left transition-all duration-300 group ${formData.tipo === 'standard'
                      ? 'border-[var(--nero)] bg-[var(--nero)] text-[var(--panna)]'
                      : 'border-[var(--nero)]/20 hover:border-[var(--nero)]/60 bg-white'
                      }`}>
                    <div className={`absolute top-4 right-4 w-3 h-3 rounded-full border-2 ${formData.tipo === 'standard' ? 'bg-[var(--rosso)] border-[var(--rosso)]' : 'border-[var(--nero)]/30'
                      }`} />
                    <Tent size={32} className={`mb-6 ${formData.tipo === 'standard' ? 'text-[var(--rosso)]' : 'text-[var(--nero)]/60'}`} />
                    <h3 className="font-poppins font-bold text-xl uppercase tracking-wider mb-2">
                      Camper / Tenda
                    </h3>
                    <p className={`font-poppins text-sm font-light ${formData.tipo === 'standard' ? 'text-[var(--panna)]/60' : 'text-[var(--nero)]/60'}`}>
                      Camper attrezzato o tenda da campeggio
                    </p>
                    <div className={`mt-6 inline-block px-4 py-1 text-xs uppercase tracking-widest font-poppins font-bold ${formData.tipo === 'standard' ? 'bg-[var(--rosso)] text-white' : 'bg-[var(--nero)]/10 text-[var(--nero)]/50'
                      }`}>
                      Zona B · Area Camping
                    </div>
                  </button>
                </div>
              </div>

              {/* Dati personali */}
              <div className="mb-12">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-8 h-[2px] bg-[var(--rosso)]" />
                  <span className="font-poppins text-[10px] uppercase tracking-[0.3em] text-[var(--nero)]/60">
                    Passo 2 di 2
                  </span>
                </div>
                <h2 className="font-droid text-[var(--nero)] mb-10"
                  style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', letterSpacing: '-0.03em' }}>
                  I TUOI<br />DATI
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <div>
                    <label className={labelClass}>Nome *</label>
                    <input name="nome" type="text" value={formData.nome} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Cognome *</label>
                    <input name="cognome" type="text" value={formData.cognome} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Email *</label>
                    <input name="email" type="email" value={formData.email} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Telefono *</label>
                    <input name="telefono" type="tel" value={formData.telefono} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}><Users size={10} className="inline mr-1" />N° Passeggeri *</label>
                    <input name="n_passeggeri" type="number" min="1" max="9" value={formData.n_passeggeri} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Targa *</label>
                    <input name="targa" type="text" value={formData.targa} onChange={handleChange} required
                      className={`${inputClass} uppercase`} placeholder="es. AB123CD" />
                  </div>
                </div>
              </div>

              {/* Campi VW */}
              {formData.tipo === 'volkswagen' && (
                <div className="mb-12 p-8 bg-[var(--nero)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[var(--rosso)]" />
                  <h3 className="font-droid text-[var(--panna-chiaro)] text-2xl uppercase tracking-wider mb-8">
                    La tua Volkswagen
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-[var(--panna-chiaro)]/60 mb-1 font-poppins font-medium">Modello *</label>
                      <input name="modello" type="text" value={formData.modello} onChange={handleChange} required
                        className="w-full bg-transparent border-b-2 border-[var(--panna-chiaro)]/20 px-0 py-3 text-[var(--panna-chiaro)] placeholder-[var(--panna-chiaro)]/20 outline-none focus:border-[var(--rosso)] transition-colors font-poppins text-base"
                        placeholder="es. Maggiolino" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-[var(--panna-chiaro)]/60 mb-1 font-poppins font-medium">Anno *</label>
                      <input name="anno" type="number" min="1945" max="1995" value={formData.anno} onChange={handleChange} required
                        className="w-full bg-transparent border-b-2 border-[var(--panna-chiaro)]/20 px-0 py-3 text-[var(--panna-chiaro)] placeholder-[var(--panna-chiaro)]/20 outline-none focus:border-[var(--rosso)] transition-colors font-poppins text-base"
                        placeholder="es. 1972" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-[var(--panna-chiaro)]/60 mb-1 font-poppins font-medium">Note (opzionale)</label>
                      <textarea name="note" value={formData.note} onChange={handleChange} rows={2}
                        className="w-full bg-transparent border-b-2 border-[var(--panna-chiaro)]/20 px-0 py-3 text-[var(--panna-chiaro)] placeholder-[var(--panna-chiaro)]/20 outline-none focus:border-[var(--rosso)] transition-colors font-poppins text-base resize-none"
                        placeholder="Raccontaci qualcosa di speciale sulla tua auto..." />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-[var(--rosso)] text-sm font-poppins mb-6">{error}</p>
              )}

              {/* Prezzo e CTA */}
              <div className="mt-12 space-y-4">
                <div className="bg-[var(--nero)] p-8 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-poppins text-[10px] uppercase tracking-[0.3em] text-[var(--panna-chiaro)]/60 mb-1">
                      Biglietto unico evento •
                    </p>
                    <p className="font-droid text-[var(--panna-chiaro)]"
                      style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', letterSpacing: '-0.03em' }}>
                      €20,00
                    </p>
                    <p className="font-poppins text-xs text-[var(--panna-chiaro)]/30 mt-1">
                      {formData.tipo === 'volkswagen' ? 'Volkswagen · Zona A' : 'Camper/Tenda · Zona B'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-poppins text-xs text-[var(--panna-chiaro)]/60 mb-2 uppercase tracking-widest">
                      Matese Volks Camp
                    </p>
                    <p className="font-poppins text-xs text-[var(--panna-chiaro)]/60 uppercase tracking-widest">
                      7 · 8 · 9 Agosto 2026
                    </p>
                  </div>
                </div>
                <button type="submit"
                  className="w-full flex items-center rounded-xl justify-center gap-3 bg-[var(--rosso)] text-white py-6 font-poppins font-black uppercase tracking-[0.15em] text-sm hover:bg-[var(--bordeaux)] transition-colors">
                  <CreditCard size={18} />
                  Procedi al pagamento
                </button>
              </div>
            </form>
          )}

          {/* STEP: PAYMENT */}
          {step === 'payment' && (
            <div>
              <h2 className="font-droid text-[var(--nero)] mb-12"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', letterSpacing: '-0.03em' }}>
                RIEPILOGO
              </h2>

              {/* Riepilogo card */}
              <div className="border-2 border-[var(--nero)] mb-10">
                <div className="grid grid-cols-2 divide-x-2 divide-[var(--nero)] border-b-2 border-[var(--nero)]">
                  <div className="p-6">
                    <p className="font-poppins text-[10px] uppercase tracking-[0.2em] text-[var(--nero)]/60 mb-2">Nominativo</p>
                    <p className="font-poppins font-semibold">{formData.nome} {formData.cognome}</p>
                  </div>
                  <div className="p-6">
                    <p className="font-poppins text-[10px] uppercase tracking-[0.2em] text-[var(--nero)]/60 mb-2">Veicolo</p>
                    <p className="font-poppins font-semibold uppercase">{formData.targa}</p>
                    {formData.modello && <p className="font-poppins text-sm text-[var(--nero)]/50">{formData.modello} {formData.anno}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x-2 divide-[var(--nero)]">
                  <div className="p-6">
                    <p className="font-poppins text-[10px] uppercase tracking-[0.2em] text-[var(--nero)]/60 mb-2">Tipo</p>
                    <p className="font-poppins font-semibold">
                      {formData.tipo === 'volkswagen' ? 'Volkswagen — Zona A' : 'Camper/Tenda — Zona B'}
                    </p>
                  </div>
                  <div className="p-6">
                    <p className="font-poppins text-[10px] uppercase tracking-[0.2em] text-[var(--nero)]/60 mb-2">Totale</p>
                    <p className="font-droid text-2xl text-[var(--rosso)]">€20,00</p>
                  </div>
                </div>
              </div>

              {loading && (
                <p className="text-center text-[var(--nero)]/60 font-poppins text-xs uppercase tracking-widest py-8">
                  Elaborazione in corso...
                </p>
              )}

              {!loading && (
                <div className="max-w-md">
                  <PayPalButtons
                    style={{ layout: 'vertical', color: 'black', shape: 'rect', label: 'pay' }}
                    createOrder={(data, actions) => actions.order.create({
                      intent: 'CAPTURE',
                      purchase_units: [{
                        amount: { value: '20.00', currency_code: 'EUR' },
                        description: `Matese Volks Camp 2026 — ${formData.tipo === 'volkswagen' ? 'Volkswagen' : 'Camper/Tenda'}`,
                      }],
                    })}
                    onApprove={async (data, actions) => {
                      const order = await actions.order!.capture()
                      await handlePaymentSuccess(order.id!)
                    }}
                    onError={() => setError('Errore PayPal. Riprova.')}
                  />
                </div>
              )}

              {error && <p className="text-[var(--rosso)] text-sm font-poppins mt-4">{error}</p>}

              <button onClick={() => setStep('form')}
                className="mt-8 text-[var(--nero)]/30 hover:text-[var(--nero)] text-xs uppercase tracking-[0.2em] font-poppins transition-colors">
                ← Modifica dati
              </button>
            </div>
          )}

          {/* STEP: SUCCESS */}
          {step === 'success' && (
            <div>
              <div className="mb-12">
                <CheckCircle size={48} className="text-[var(--rosso)] mb-6" />
                <h2 className="font-droid text-[var(--nero)]"
                  style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', letterSpacing: '-0.03em', lineHeight: 0.9 }}>
                  CI VEDIAMO<br />
                  <span className="text-[var(--rosso)]">AD AGOSTO!</span>
                </h2>
              </div>

              <div className="border-2 border-[var(--nero)] mb-8">
                <div className="bg-[var(--nero)] px-8 py-4">
                  <p className="font-poppins text-[10px] uppercase tracking-[0.3em] text-[var(--panna-chiaro)]/60">
                    Codice biglietto
                  </p>
                </div>
                <div className="px-8 py-6">
                  <p className="font-mono text-base font-bold text-[var(--rosso)] break-all leading-relaxed">
                    {uuid}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-poppins text-sm text-[var(--nero)]/50">
                  Riceverai una email di conferma con il tuo codice.
                </p>
                <p className="font-poppins text-sm text-[var(--nero)]/50">
                  Mostra questo codice all'ingresso dell'evento.
                </p>
                <p className="font-poppins text-sm font-semibold text-[var(--nero)] pt-2">
                  7 · 8 · 9 Agosto 2026 — Campitello Matese (CB)
                </p>
              </div>
            </div>
          )}

          <Donazione />

        </section>
      </main>
    </PayPalScriptProvider>
  )
}