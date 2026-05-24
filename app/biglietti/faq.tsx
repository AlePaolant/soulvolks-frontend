'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    q: 'Posso acquistare più biglietti?',
    a: 'Sì, puoi acquistare un biglietto per ogni veicolo. Se vieni con più auto, ogni auto deve avere il proprio biglietto.'
  },
  {
    q: 'Il biglietto vale per tutte e tre le notti?',
    a: 'Sì, il biglietto è unico per l\'intero evento (7-8-9 Agosto). Non importa se arrivi venerdì o sabato — il prezzo è lo stesso.'
  },
  {
    q: 'Posso venire solo per un giorno?',
    a: 'Certo! Il biglietto vale per l\'intera durata dell\'evento ma non sei obbligato a restare tutte e tre le notti. Puoi arrivare e ripartire quando vuoi.'
  },
  {
    q: 'Cosa succede se non ho una Volkswagen?',
    a: 'Nessun problema! Puoi partecipare con qualsiasi veicolo, camper o tenda. Sarai nella Zona B — un\'area camping dedicata.'
  },
  {
    q: 'Posso pagare in contanti all\'ingresso?',
    a: 'Sì, è possibile pagare in contanti direttamente all\'ingresso. Tieni presente che la prevendita online ci aiuta a organizzare meglio l\'evento — apprezziamo chi acquista in anticipo!'
  },
  {
    q: 'Ho acquistato il biglietto ma non ho ricevuto l\'email. Cosa faccio?',
    a: 'Controlla la cartella spam. Se non trovi nulla, contattaci su info@soulvolks.it con il codice biglietto che hai ricevuto a schermo.'
  },
  {
    q: 'Posso fare un rimborso?',
    a: 'I biglietti non sono rimborsabili, ma sono trasferibili. Se non puoi venire, puoi cedere il biglietto a un\'altra persona comunicandocelo via email.'
  },
  {
    q: 'C\'è un limite di posti?',
    a: 'No, non c\'è un limite fisso. La prevendita ci serve per organizzare al meglio spazi e servizi. Prima prenoti, meglio è!'
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="max-w-4xl mx-auto px-8 py-20 border-t-2 items-center border-[var(--nero)]/10 mt-20 pt-20">
      
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-[2px] bg-[var(--rosso)]" />
        <span className="font-poppins text-md uppercase tracking-[0.3em] text-[var(--nero)]/80">
          Hai dubbi?
        </span>
      </div>

      <h2 className="font-droid text-[var(--nero)] mb-12"
        style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', letterSpacing: '-0.03em' }}>
        DOMANDE FREQUENTI
      </h2>

      <div className="space-y-0 max-w-2xl">
        {faqs.map((faq, i) => (
          <div key={i} className="border-b border-[var(--nero)]/10">
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between py-5 text-left gap-4 group">
              <span className="font-poppins font-semibold text-base text-[var(--nero)] group-hover:text-[var(--rosso)] transition-colors">
                {faq.q}
              </span>
              <span className="shrink-0 text-[var(--nero)]/30">
                {open === i ? <Minus size={16} /> : <Plus size={16} />}
              </span>
            </button>
            {open === i && (
              <div className="pb-5">
                <p className="font-poppins text-sm text-[var(--nero)]/60 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

    </section>
  )
}