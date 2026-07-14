'use client'

import { useState } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { Heart } from 'lucide-react'

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb'

const IMPORTI_PRESET = [5, 10, 20, 50]

export default function Donazione() {
  const [importo, setImporto] = useState<number | ''>('')
  const [custom, setCustom] = useState(false)
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form')
  const [error, setError] = useState('')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')

  const importoFinale = typeof importo === 'number' && importo > 0 ? importo : null
  const datiValidi = nome.trim().length > 0 && /\S+@\S+\.\S+/.test(email)

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'EUR' }}>
      <section id="donazioni" className="border-t-2 border-[var(--nero)]/10 mt-20 pt-20 mx-auto">
        
        <div className="flex items-center gap-4 mb-6">
                  <div className="w-8 h-[2px] bg-[var(--rosso)]" />
                  <span className="font-poppins text-sm uppercase tracking-[0.3em] text-[var(--nero)]/80">
                    Opzionale
                  </span>
                </div>

        <h2 className="font-droid text-[var(--nero)] mb-4"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
          SUPPORTA L'EVENTO
        </h2>
        <p className="font-poppins text-[var(--nero)]/80 text-md mb-10 max-w-lg">
          Se vuoi contribuire alla realizzazione del Matese Volks Camp, 
          puoi fare una donazione libera. Ogni contributo fa la differenza.
        </p>

        {step === 'form' && (
          <div className="space-y-6 max-w-lg">
            {/* Dati donatore */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] font-poppins text-[var(--nero)]/40 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Il tuo nome"
                  className="w-full bg-transparent border-b-2 border-[var(--nero)]/30 px-0 py-2 text-[var(--nero)] font-poppins font-black outline-none focus:border-[var(--rosso)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] font-poppins text-[var(--nero)]/40 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="la-tua@email.it"
                  className="w-full bg-transparent border-b-2 border-[var(--nero)]/30 px-0 py-2 text-[var(--nero)] font-poppins font-black outline-none focus:border-[var(--rosso)] transition-colors"
                />
              </div>
            </div>

            {/* Importi preset */}
            <div className="grid grid-cols-4 gap-3">
              {IMPORTI_PRESET.map((i) => (
                <button key={i} type="button"
                  onClick={() => { setImporto(i); setCustom(false) }}
                  className={`py-4 border-2 rounded-lg font-poppins font-black text-lg transition-all ${
                    importo === i && !custom
                      ? 'border-[var(--nero)] bg-[var(--nero)] text-[var(--panna)]'
                      : 'border-[var(--nero)]/20 hover:border-[var(--rosso)]/90'
                  }`}>
                  €{i}
                </button>
              ))}
            </div>

            {/* Importo custom */}
            <div>
              <button type="button"
                onClick={() => { setCustom(true); setImporto('') }}
                className={`text-sm uppercase tracking-[0.2em] font-poppins transition-colors ${
                  custom ? 'text-[var(--rosso)]' : 'text-[var(--nero)] hover:text-[var(--rosso)]'
                }`}>
                + Importo personalizzato
              </button>
              {custom && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="font-poppins font-black text-2xl">€</span>
                  <input
                    type="number" min="1" placeholder="es. 15"
                    value={importo}
                    onChange={(e) => setImporto(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-transparent border-b-2 border-[var(--nero)]/30 px-0 py-2 text-[var(--nero)] text-xl font-poppins font-black outline-none focus:border-[var(--rosso)] transition-colors"
                  />
                </div>
              )}
            </div>

            {error && <p className="text-[var(--rosso)] text-sm font-poppins">{error}</p>}

            {importoFinale && (
              <button
                onClick={() => {
                  if (!datiValidi) {
                    setError('Inserisci nome e una email valida prima di procedere.')
                    return
                  }
                  setError('')
                  setStep('payment')
                }}
                className="w-full flex items-center justify-center gap-3 bg-[var(--nero)] text-[var(--panna)] py-5 font-poppins font-black uppercase tracking-[0.15em] text-sm hover:bg-[var(--rosso)] transition-colors">
                <Heart size={18} />
                Dona €{importoFinale}
              </button>
            )}
          </div>
        )}

        {step === 'payment' && (
          <div className="max-w-md space-y-6">
            <div className="border-2 border-[var(--nero)] p-6 flex justify-between items-center">
              <span className="font-poppins text-xs uppercase tracking-[0.2em] text-[var(--nero)]/40">Donazione</span>
              <span className="font-poppins font-black text-2xl text-[var(--rosso)]">€{importoFinale}</span>
            </div>
            <PayPalButtons
              style={{ layout: 'vertical', color: 'black', shape: 'rect', label: 'donate' }}
              createOrder={(data, actions) => actions.order.create({
                intent: 'CAPTURE',
                purchase_units: [{
                  amount: { value: String(importoFinale), currency_code: 'EUR' },
                  description: 'Donazione Matese Volks Camp 2026',
                }],
              })}
              onApprove={async (data, actions) => {
                await actions.order!.capture()

                // Notifica al backend: verifica server-side + email + telegram
                try {
                  const res = await fetch('/api/donazioni', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      nome,
                      email,
                      paypal_order_id: data.orderID,
                    }),
                  })

                  if (!res.ok) {
                    const err = await res.json()
                    console.error('Errore verifica donazione:', err)
                    // Il pagamento PayPal è già andato a buon fine: mostriamo comunque
                    // successo al donatore, ma logghiamo l'errore per controllo manuale.
                  }
                } catch (err) {
                  console.error('Errore chiamata /api/donazioni:', err)
                }

                setStep('success')
              }}
              onError={() => setError('Errore PayPal. Riprova.')}
            />
            <button onClick={() => setStep('form')}
              className="text-[var(--nero)]/30 hover:text-[var(--nero)] text-xs uppercase tracking-[0.2em] font-poppins transition-colors">
              ← Cambia importo
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 max-w-md">
            <Heart size={40} className="text-[var(--rosso)]" />
            <h3 className="font-droid text-3xl text-[var(--nero)]">GRAZIE!</h3>
            <p className="font-poppins text-sm text-[var(--nero)]/50">
              La tua donazione di <strong className="text-[var(--nero)]">€{importoFinale}</strong> è stata ricevuta. 
              Ci aiuti a rendere il Matese Volks Camp ancora più speciale. Riceverai una email di conferma a breve.
            </p>
          </div>
        )}

      </section>
    </PayPalScriptProvider>
  )
}