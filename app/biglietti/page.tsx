'use client'

import { useState } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { Car, Tent, Users, User, Mail, Phone, CreditCard, MapPin, Calendar, CheckCircle, Heart } from 'lucide-react'
import Donazione from './donazione'
import FAQ from './faq'
import Footer from './footer'

import { QRCodeSVG } from 'qrcode.react'


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
  outline-none focus:border-[var(--bordeaux)] transition-colors 
  font-poppins text-xl
`

const labelClass = `block text-sm uppercase tracking-[0.2em] text-[var(--nero)]/90 mb-0 font-poppins font-medium`

export default function BigliettiPage() {
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form')

  const [formData, setFormData] = useState<FormData>({
    nome: '', cognome: '', email: '', telefono: '',
    n_passeggeri: '1', targa: '', tipo: 'standard',
    modello: '', anno: '', note: '',
  })
  const [uuid, setUuid] = useState('')
  const [infoOpen, setInfoOpen] = useState(false)
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

      // Aspetta che il DOM del biglietto venga renderizzato
      setStep('success')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Invia email con PDF
      await fetch('/api/biglietti/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          uuid: data.uuid,
          zona: formData.tipo === 'volkswagen' ? 'A' : 'B',
        }),
      })

      await fetch('/api/biglietti/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, uuid: data.uuid }),
      })

    } catch (err: any) {
      setError(err.message || 'Errore durante il pagamento')
      setStep('payment')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    const res = await fetch('/api/biglietti/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uuid,
        nome: formData.nome,
        cognome: formData.cognome,
        tipo: formData.tipo,
        zona: formData.tipo === 'volkswagen' ? 'A' : 'B',
        targa: formData.targa,
        modello: formData.modello,
        anno: formData.anno,
        n_passeggeri: formData.n_passeggeri,
      }),
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `biglietto-mvc2026-${uuid.slice(0, 8)}.pdf`
    a.click()
  }

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'EUR' }}>
      <main className="min-h-screen bg-[var(--panna)]">

        {
          infoOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(21,18,13,0.75)' }}
              onClick={() => setInfoOpen(false)}
            >
              <div
                className="bg-[var(--panna)] rounded-2xl max-w-md w-full p-8 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setInfoOpen(false)}
                  className="absolute top-4 right-4 text-[var(--nero)]/40 hover:text-[var(--nero)] transition-colors font-poppins text-xl leading-none"
                >
                  ✕
                </button>

                <p className="font-poppins font-bold text-xs uppercase tracking-[0.2em] text-[var(--bordeaux)] mb-3">
                  Area B · Zona Camping
                </p>
                <h3 className="font-poppins font-bold text-2xl uppercase tracking-wide text-[var(--nero)] mb-6">
                  Veicoli ammessi
                </h3>

                <div className="space-y-4 font-poppins text-sm text-[var(--nero)]/80 leading-relaxed">
                  <div className="flex gap-3">
                    <span className="text-lg">✅</span>
                    <p><strong>Camper e roulotte</strong> — accesso diretto all'area camping.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-lg">✅</span>
                    <p><strong>Moto</strong> — accesso all'area camping, tenda a carico del partecipante.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-lg">✅</span>
                    <p><strong>Auto con tenda da tetto</strong> — ammesse nell'area camping.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-lg">❌</span>
                    <p><strong>Auto normali</strong> — non ammesse nell'area camping. Puoi parcheggiare nel parcheggio adiacente e scendere a piedi nel pianoro: l'accesso a piedi è gratuito.</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-[var(--nero)] rounded-xl">
                  <p className="font-poppins text-xs text-[var(--panna-chiaro)]/70 uppercase tracking-widest mb-1">Ricorda</p>
                  <p className="font-poppins text-sm text-[var(--panna-chiaro)] leading-relaxed">
                    La quota è <strong>per veicolo</strong>. Tutti i passeggeri e accompagnatori entrano gratis.
                  </p>
                </div>
              </div>
            </div>
          )
        }

        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="relative bg-[var(--scuro)] overflow-hidden" style={{ minHeight: 'auto' }}>

          {/* Texture grana */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '200px' }} />

          {/* Linea rossa bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[var(--bordeaux)] z-20" />

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
                <h1 className="font-droid text-[var(--panna-chiaro)] leading-[0.95] text-[6rem] md:text-[6rem] lg:text-[10rem]"
                  style={{ textShadow: '6px 6px 0px rgba(225,39,19,0.25)' }}>
                  MATESE<br />
                  <span className="text-[var(--bordeaux)]">VOLKS</span><br />
                  CAMP
                </h1>
                <p className="font-poppins font-black text-[var(--bordeaux)] mt-1 tracking-[0.4em]"
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
                    <span className="font-droid text-[var(--bordeaux)] text-[3.5rem] sm:text-[3rem] md:text-[3rem] lg:text-[3.5rem]">€20</span>

                    <span className="font-poppins text-[var(--panna-chiaro)]/80 text-lg">/ veicolo</span>
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
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-8 h-[2px] bg-[var(--rosso)]" />
                  <span className="font-poppins text-sm uppercase tracking-[0.3em] text-[var(--nero)]/80">
                    Passo 1 di 2
                  </span>
                </div>
                <h2 className="font-droid text-[var(--nero)] mb-8 whitespace-nowrap"
                  style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
                  CHE AUTO PORTI?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Card Volkswagen */}
                  <button type="button" onClick={() => setFormData({ ...formData, tipo: 'volkswagen' })}
                    className={`relative p-8 border-2 rounded-xl text-left transition-all duration-300 group ${formData.tipo === 'volkswagen'
                      ? 'border-[var(--nero)] bg-[var(--nero)] text-[var(--panna)]'
                      : 'border-[var(--nero)]/20 hover:border-[var(--nero)]/60 bg-white'
                      }`}>
                    <div className={`absolute top-4 right-4 w-3 h-3 rounded-full border-2 ${formData.tipo === 'volkswagen' ? 'bg-[var(--bordeaux)] border-[var(--bordeaux)]' : 'border-[var(--nero)]/30'
                      }`} />
                    <Car size={32} className={`mb-6 ${formData.tipo === 'volkswagen' ? 'text-[var(--bordeaux)]' : 'text-[var(--nero)]/60'}`} />
                    <h3 className="font-poppins font-bold text-xl uppercase tracking-wider mb-2">
                      Volkswagen
                    </h3>
                    <p className={`font-poppins text-sm font-light ${formData.tipo === 'volkswagen' ? 'text-[var(--panna)]/60' : 'text-[var(--nero)]/60'}`}>
                      Maggiolino, Maggiolone, T1, T2, T3 e altri modelli
                    </p>
                    <div className={`mt-6 inline-block px-4 py-1 text-xs uppercase tracking-widest font-poppins font-bold ${formData.tipo === 'volkswagen' ? 'bg-[var(--bordeaux)] text-white' : 'bg-[var(--nero)]/10 text-[var(--nero)]/50'
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
                    <div className={`absolute top-4 right-4 w-3 h-3 rounded-full border-2 ${formData.tipo === 'standard' ? 'bg-[var(--bordeaux)] border-[var(--bordeaux)]' : 'border-[var(--nero)]/30'
                      }`} />
                    <Tent size={32} className={`mb-6 ${formData.tipo === 'standard' ? 'text-[var(--bordeaux)]' : 'text-[var(--nero)]/60'}`} />
                    <h3 className="font-poppins font-bold text-xl uppercase tracking-wider mb-2">
                      Altro veicolo / Moto / Tenda
                    </h3>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); setInfoOpen(true) }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setInfoOpen(true) } }}
                      className={`font-poppins text-sm font-light underline underline-offset-2 cursor-pointer ${formData.tipo === 'standard' ? 'text-[var(--panna)]/70' : 'text-[var(--nero)]/60'}`}>
                      Il mio veicolo è ammesso? →
                    </span>
                    <div className={`mt-6 inline-block px-4 py-1 text-xs uppercase tracking-widest font-poppins font-bold ${formData.tipo === 'standard' ? 'bg-[var(--bordeaux)] text-white' : 'bg-[var(--nero)]/10 text-[var(--nero)]/50'
                      }`}>
                      Zona B · Area Camping
                    </div>
                  </button>
                </div>
              </div>

              {/* Dati personali */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-8 h-[2px] bg-[var(--rosso)]" />
                  <span className="font-poppins text-sm uppercase tracking-[0.3em] text-[var(--nero)]/80">
                    Passo 2 di 2
                  </span>
                </div>
                <h2 className="font-droid text-[var(--nero)] mb-8 whitespace-nowrap"
                  style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
                  I TUOI DATI
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <div>
                    <label className={labelClass}><User size={10} className="inline mr-1" />Nome *</label>
                    <input name="nome" type="text" value={formData.nome} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}><User size={10} className="inline mr-1" />Cognome *</label>
                    <input name="cognome" type="text" value={formData.cognome} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}><Mail size={10} className="inline mr-1" />Email *</label>
                    <input name="email" type="email" value={formData.email} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}><Phone size={10} className="inline mr-1" />Telefono *</label>
                    <input name="telefono" type="tel" value={formData.telefono} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}><Users size={10} className="inline mr-1" />N° Passeggeri *</label>
                    <input name="n_passeggeri" type="number" min="1" max="9" value={formData.n_passeggeri} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}><Car size={10} className="inline mr-1" />Targa *</label>
                    <input name="targa" type="text" value={formData.targa} onChange={handleChange} required
                      className={`${inputClass} uppercase`} placeholder="es. AB123CD" />
                  </div>
                </div>
              </div>

              {/* Campi VW */}
              {formData.tipo === 'volkswagen' && (
                <div className="mb-8 p-8 bg-[var(--bordeaux)] relative overflow-hidden rounded-xl">
                  <h3 className="font-poppins text-[var(--panna-chiaro)] text-2xl font-bold uppercase tracking-wider mb-8">
                    La tua Volkswagen
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-[var(--panna-chiaro)] mb-1 font-poppins font-medium">Modello *</label>
                      <input name="modello" type="text" value={formData.modello} onChange={handleChange} required
                        className="w-full bg-transparent border-b-2 border-[var(--panna-chiaro)]/60 px-0 py-3 text-[var(--panna-chiaro)] placeholder-[var(--panna-chiaro)]/50 outline-none focus:border-[var(--bordeaux)] transition-colors font-poppins text-base"
                        placeholder="es. Maggiolino" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-[var(--panna-chiaro)] mb-1 font-poppins font-medium">Anno *</label>
                      <input name="anno" type="number" min="1945" max="1995" value={formData.anno} onChange={handleChange} required
                        className="w-full bg-transparent border-b-2 border-[var(--panna-chiaro)]/60 px-0 py-3 text-[var(--panna-chiaro)] placeholder-[var(--panna-chiaro)]/50 outline-none focus:border-[var(--bordeaux)] transition-colors font-poppins text-base"
                        placeholder="es. 1972" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-[var(--panna-chiaro)] mb-1 font-poppins font-medium">Note (opzionale)</label>
                      <textarea name="note" value={formData.note} onChange={handleChange} rows={2}
                        className="w-full bg-transparent border-b-2 border-[var(--panna-chiaro)]/60 px-0 py-3 text-[var(--panna-chiaro)] placeholder-[var(--panna-chiaro)]/50 outline-none focus:border-[var(--bordeaux)] transition-colors font-poppins text-base resize-none"
                        placeholder="Raccontaci qualcosa di speciale sulla tua auto..." />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-[var(--bordeaux)] text-sm font-poppins mb-6">{error}</p>
              )}

              {/* Prezzo e CTA */}
              <div className="mt-12 space-y-4">
                <div className="bg-[var(--nero)] p-8 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-poppins font-bold text-[16px] uppercase tracking-[0.3em] text-[var(--panna-chiaro)]/60 mb-1">
                      Biglietto unico evento
                    </p>
                    <p className="font-droid text-[var(--panna-chiaro)]"
                      style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', letterSpacing: '-0.03em' }}>
                      €20,00
                    </p>
                    <p className="font-poppins text-sm text-[var(--panna-chiaro)]/70 mt-1">
                      {formData.tipo === 'volkswagen' ? 'Volkswagen · Zona A' : 'Camper/Tenda · Zona B'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-poppins text-xs text-[var(--panna-chiaro)]/80 mb-2 uppercase tracking-widest">
                      Matese Volks Camp
                    </p>
                    <p className="font-poppins text-xs text-[var(--panna-chiaro)]/80 uppercase tracking-widest">
                      7 · 8 · 9 Agosto 2026
                    </p>
                  </div>
                </div>
                <p className="font-poppins text-md text-[var(--nero)]/80 text-center px-2">
                  Procedendo al pagamento accetti i nostri{' '}
                  <a href="/termini" target="_blank" className="underline text-[var(--nero)] hover:text-[var(--rosso)] transition-colors">
                    Termini e Condizioni
                  </a>
                </p>
                <button type="submit"
                  className="w-full flex items-center rounded-xl justify-center gap-3 bg-[var(--bordeaux)] text-white py-6 font-poppins font-black uppercase tracking-[0.15em] text-sm hover:bg-[var(--bordeaux)] transition-colors">
                  <CreditCard size={18} />
                  Procedi al pagamento
                </button>
              </div>
            </form>
          )}

          {/* STEP: PAYMENT */}
          {step === 'payment' && (
            <div>
              <h2 className="font-droid text-[var(--nero)] mb-8"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', letterSpacing: '-0.03em' }}>
                RIEPILOGO
              </h2>

              {/* Riepilogo card */}
              <div className="mb-10 space-y-4">
                {[
                  { label: 'Nominativo', value: `${formData.nome} ${formData.cognome}` },
                  { label: 'Veicolo', value: `${formData.targa.toUpperCase()}${formData.modello ? ` · ${formData.modello} ${formData.anno}` : ''}` },
                  { label: 'Tipo', value: formData.tipo === 'volkswagen' ? 'Volkswagen — Zona A' : 'Camper/Tenda — Zona B' },
                  { label: 'Totale', value: '€20,00', highlight: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-baseline justify-between py-4 border-b border-[var(--nero)]/10">
                    <span className="font-poppins text-sm uppercase tracking-[0.2em] text-[var(--nero)]">{item.label}</span>
                    <span className={`font-poppins font-semibold ${item.highlight ? 'text-[var(--rosso)] text-2xl font-black' : 'text-[var(--nero)]'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {loading && (
                <p className="text-center text-[var(--nero)]/60 font-poppins text-xs uppercase tracking-widest py-8">
                  Elaborazione in corso...
                </p>
              )}

              {!loading && (
                <div className="max-w-md mx-auto">
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

              {error && <p className="text-[var(--bordeaux)] text-sm font-poppins mt-4">{error}</p>}

              <button onClick={() => setStep('form')}
                className="mt-8 text-[var(--nero)] hover:text-[var(--rosso)] font-bold text-sm uppercase tracking-[0.2em] font-poppins transition-colors">
                ← Modifica dati
              </button>
            </div>
          )}

          {/* STEP: SUCCESS */}
          {step === 'success' && (
            <div className="max-w-2xl mx-auto">

              {/* Titolo */}
              <div className="flex items-center gap-4 mb-10">
                <CheckCircle size={36} className="text-[var(--bordeaux)] shrink-0" />
                <h2 className="font-droid text-[var(--nero)]"
                  style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  CI VEDIAMO <span className="text-[var(--bordeaux)]">AD AGOSTO!</span>
                </h2>
              </div>

              {/* Biglietto */}
              <div id="biglietto-pdf" className="border-2 border-[var(--nero)] p-8 mb-6"
                style={{ backgroundColor: '#fef9ec', color: '#15120d', width: '600px', maxWidth: '100%' }}>

                {/* Header biglietto */}
                <div className="flex justify-between items-end mb-8 pb-6 border-b-2 border-[#15120d]">
                  <div>
                    <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: '1.5rem', color: '#15120d' }}>
                      SOUL VOLKS
                    </p>
                    <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', color: '#15120d', opacity: 0.8, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                      Matese Volks Camp 2026
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', color: '#15120d', opacity: 0.8, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                      7 · 8 · 9 Agosto 2026
                    </p>
                    <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', color: '#15120d', opacity: 0.8, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                      Campitello Matese (CB)
                    </p>
                  </div>
                </div>

                {/* Contenuto */}
                <div className="flex gap-8 items-start mb-8">
                  <QRCodeSVG value={uuid} size={160} bgColor="#fef9ec" fgColor="#15120d" />
                  <div className="flex flex-col gap-4">
                    <div>
                      <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.65rem', color: '#15120d', opacity: 0.8, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Intestatario</p>
                      <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#15120d' }}>{formData.nome} {formData.cognome}</p>
                    </div>
                    <div>
                      <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.65rem', color: '#15120d', opacity: 0.8, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Targa</p>
                      <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#15120d', textTransform: 'uppercase' }}>{formData.targa}</p>
                    </div>
                    <div>
                      <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.65rem', color: '#15120d', opacity: 0.8, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Tipo</p>
                      <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#15120d' }}>
                        {formData.tipo === 'volkswagen' ? (
                          <>Volkswagen<br />Zona A</>
                        ) : (
                          <>Camper/Tenda<br />Zona B</>
                        )}
                      </p>
                    </div>
                    {formData.modello && (
                      <div>
                        <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.65rem', color: '#15120d', opacity: 0.8, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Veicolo</p>
                        <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#15120d' }}>{formData.modello} {formData.anno}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.65rem', color: '#15120d', opacity: 0.8, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Importo pagato</p>
                      <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: '1.5rem', color: '#780e02' }}>€20,00</p>
                    </div>
                  </div>
                </div>

                {/* Footer codice */}
                <div style={{ borderTop: '1px solid rgba(21,18,13,0.15)', paddingTop: '16px' }}>
                  <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.65rem', color: '#15120d', opacity: 0.5, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                    Codice biglietto
                  </p>
                  <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#15120d', wordBreak: 'break-all', letterSpacing: '0.05em' }}>
                    {uuid}
                  </p>
                </div>
              </div>

              {/* Bottone download */}
              <button onClick={downloadPDF}
                className="w-full flex items-center rounded-lg justify-center gap-3 bg-[var(--nero)] text-[var(--panna)] py-5 font-poppins font-black uppercase tracking-[0.15em] text-sm hover:bg-[var(--bordeaux)] transition-colors mb-4">
                Scarica biglietto PDF
              </button>
              <p className="font-poppins text-sm text-[var(--nero)]/60 text-center mb-8">
                Riceverai anche il biglietto via email con il PDF allegato.
              </p>

            </div>
          )}

          <Donazione />
          <FAQ />

        </section>

        <Footer />
      </main>
    </PayPalScriptProvider>
  )
}