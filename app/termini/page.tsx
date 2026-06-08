'use client'
import { useState } from 'react'

const articoli = [
    {
        id: 'art1',
        numero: '01',
        titolo: "Oggetto dell'Evento e Servizi",
        intro: "Il Matese Volks Camp è un raduno socio-culturale e ricreativo promosso, pianificato e gestito dall'Associazione Soul Volks. Il titolo d'accesso conferisce il diritto di fruire delle infrastrutture e del palinsesto di attività nei giorni e orari indicati nel programma ufficiale.",
        punti: [
            { label: "Esecuzioni musicali dal vivo", testo: "Spettacoli concertistici su strutture palco omologate." },
            { label: "DJ Set e intrattenimento sonoro", testo: "Sessioni di missaggio audio nelle fasce orarie autorizzate." },
            { label: "Attività ricreative e culturali", testo: "Workshop, officine tecniche, competizioni di veicoli, attività outdoor." },
            { label: "Area espositiva e mercatino", testo: "Accesso al settore commerciale temporaneo per artigiani, hobbisti e venditori di ricambistica." },
            { label: "Aree di ristoro", testo: "Punti di somministrazione di alimenti e bevande a carico dell'utente, salvo ove diversamente specificato." },
        ]
    },
    {
        id: 'art2',
        numero: '02',
        titolo: "Acquisto Online e Biglietto Digitale",
        intro: "L'acquisto avviene esclusivamente tramite il sito ufficiale soulvolks.it. Il pagamento è elaborato tramite PayPal. L'Organizzazione non memorizza né ha accesso ai dati dello strumento di pagamento dell'acquirente.",
        punti: [
            { label: "Perfezionamento del contratto", testo: "Il contratto si intende concluso nel momento in cui il sistema registra l'avvenuto pagamento e genera il biglietto digitale." },
            { label: "Conferma e biglietto digitale", testo: "A seguito dell'acquisto, l'acquirente riceverà all'indirizzo email fornito una email di conferma con il biglietto in formato PDF con QR Code univoco. Tale documento è l'unico titolo d'accesso valido." },
            { label: "Mancata ricezione dell'email", testo: "Verificare la cartella spam entro 24 ore. In caso di ulteriore mancanza, contattare l'Organizzazione tramite i canali ufficiali. Non si risponde per email non consegnate a causa di filtri antispam o indirizzi errati forniti dall'acquirente." },
            { label: "Malfunzionamenti tecnici", testo: "In caso di addebito senza emissione del biglietto per errore tecnico, l'Organizzazione si impegna a verificare e procedere all'emissione o al rimborso integrale. La segnalazione deve avvenire entro 48 ore tramite i canali ufficiali." },
            { label: "Dati forniti in fase d'acquisto", testo: "L'acquirente è responsabile della correttezza dei dati inseriti. Dati errati che impedissero la fruizione del biglietto non danno diritto a rimborso né sostituzione." },
        ]
    },
    {
        id: 'art3',
        numero: '03',
        titolo: "Rimborsi, Cedibilità e Annullamento",
        intro: "Il biglietto digitale è strettamente non rimborsabile in qualsiasi circostanza, inclusi impedimento personale, rinuncia unilaterale e condizioni meteorologiche avverse.",
        punti: [
            { label: "Non rimborsabilità", testo: "L'Organizzazione non pratica rimborsi parziali né totali una volta completato il pagamento." },
            { label: "Cedibilità a terzi", testo: "Il titolo è liberamente cedibile. Il cessionario subentra in tutti i diritti e obblighi. La cessione avviene sotto piena responsabilità del cedente: l'Organizzazione non risponde di frodi tra privati o utilizzo improprio del QR Code." },
            { label: "QR Code univoco e antifrode", testo: "Ogni biglietto è associato a un QR Code univoco non duplicabile. Il sistema rileva automaticamente i tentativi di utilizzo multiplo: solo il primo utilizzo validerà l'accesso." },
            { label: "Annullamento o rinvio dell'Evento", testo: "In caso di annullamento per cause di forza maggiore, l'Organizzazione comunicherà le proprie determinazioni tramite i canali ufficiali. La politica di rimborso sarà definita in conformità con le normative vigenti." },
        ]
    },
    {
        id: 'art4',
        numero: '04',
        titolo: "Accesso e Piano di Sicurezza",
        intro: "L'accesso all'Evento è disciplinato per tipologia di utenza e regolato da un Piano di Sicurezza e di Emergenza redatto da tecnici abilitati in conformità con le direttive ministeriali vigenti.",
        punti: [
            { label: "Partecipanti con veicolo/campeggio", testo: "L'accesso è subordinato al possesso e all'esibizione del biglietto digitale (QR Code) acquistato tramite i canali ufficiali." },
            { label: "Visitatori esclusivamente pedonali", testo: "Accesso gratuito alle aree comuni nei limiti della capienza massima consentita dalle autorità competenti." },
            { label: "Osservanza del Piano di Sicurezza", testo: "Tutti i partecipanti hanno l'obbligo tassativo di rispettare le indicazioni della cartellonistica d'emergenza, le vie di fuga e le direttive del personale addetto alla sicurezza." },
            { label: "Verifiche e controlli", testo: "Lo staff si riserva la facoltà di verificare la validità dei titoli in qualsiasi momento. È vietato introdurre oggetti contundenti, sostanze infiammabili, fuochi artificiali o materiali pericolosi." },
        ]
    },
    {
        id: 'art5',
        numero: '05',
        titolo: "Presidio Sanitario",
        intro: "In ottemperanza alle normative nazionali e regionali vigenti (Accordo Stato-Regioni 5 agosto 2014 e s.m.i.), l'Organizzazione garantisce la presenza di un presidio sanitario di primo soccorso dimensionato in base al livello di rischio calcolato.",
        punti: [
            { label: "Accesso ai soccorsi", testo: "I partecipanti sono tenuti a facilitare il transito dei mezzi di soccorso. Qualsiasi malore o infortunio deve essere immediatamente segnalato allo staff o al presidio sanitario." },
            { label: "Responsabilità individuale per la salute", testo: "L'Organizzazione non risponde per condizioni mediche preesistenti, reazioni avverse al consumo di alcolici o sostanze, o malori derivanti da condotte imprudenti. Ogni partecipante valuta autonomamente la propria idoneità." },
        ]
    },
    {
        id: 'art6',
        numero: '06',
        titolo: "Regolamento Area Campeggio",
        intro: "L'area di pernottamento costituisce un insediamento temporaneo in regime di campeggio libero, non una struttura ricettiva turistica convenzionale.",
        punti: [
            { label: "Assenza di piazzole e allacciamenti elettrici", testo: "I partecipanti devono garantire corridoi di transito liberi, destinati alle vie di fuga e ai mezzi di soccorso." },
            { label: "Presidi igienico-sanitari", testo: "L'Organizzazione mette a disposizione servizi igienici, docce, spogliatoi e lavandini con servizio periodico di pulizia e sanificazione." },
            { label: "Gestione rifiuti", testo: "Sono istituite isole ecologiche per la raccolta differenziata. È obbligatorio separare correttamente i rifiuti. Il littering comporta l'allontanamento immediato e segnalazione alle autorità." },
            { label: "Prevenzione incendi", testo: "Vietato accendere fuochi liberi sul terreno. Barbecue e fornelli a gas sono consentiti solo nel rispetto delle distanze di sicurezza, sotto supervisione e con mezzi di estinzione a portata di mano." },
        ]
    },
    {
        id: 'art7',
        numero: '07',
        titolo: "Requisiti dei Veicoli",
        intro: "Tutti i veicoli ammessi devono rispondere a standard tecnici e normativi precisi, verificabili in qualsiasi momento dallo staff.",
        punti: [
            { label: "Stato di manutenzione", testo: "Il veicolo deve essere in perfetto stato meccanico e impiantistico. Sono vietati veicoli con perdite evidenti di fluidi lubrificanti, carburante o refrigeranti." },
            { label: "Regolarità documentale", testo: "Carta di Circolazione valida, revisione periodica in corso e copertura assicurativa RC Auto obbligatoria per legge." },
            { label: "Verifiche e allontanamento", testo: "In caso di inadempienza o non idoneità, il veicolo sarà allontanato dall'area a spese del proprietario." },
            { label: "Circolazione interna", testo: "Velocità massima: passo d'uomo (max 5 km/h). La circolazione è consentita solo nelle fasi di arrivo, posizionamento e partenza." },
        ]
    },
    {
        id: 'art8',
        numero: '08',
        titolo: "Accesso con Animali Domestici",
        intro: "L'introduzione di animali domestici è consentita alle seguenti condizioni, volte a tutelare l'incolumità pubblica e il benessere animale.",
        punti: [
            { label: "Contenzione", testo: "I cani devono essere al guinzaglio (max 1,50 m) in ogni area. La museruola deve essere portata con sé e applicata su richiesta dello staff o in caso di assembramenti." },
            { label: "Profilassi igienica", testo: "Obbligo di raccogliere le deiezioni solide e smaltirle negli appositi contenitori." },
            { label: "Responsabilità per danni", testo: "Il proprietario o detentore risponde civilmente e penalmente (art. 2052 c.c.) per qualsiasi danno cagionato dall'animale. L'Associazione Soul Volks è totalmente estranea da qualsiasi pretesa risarcitoria." },
        ]
    },
    {
        id: 'art9',
        numero: '09',
        titolo: "Esonero e Limiti di Responsabilità",
        intro: "L'Associazione Soul Volks declina ogni responsabilità civile, penale, patrimoniale e amministrativa per eventi avversi occorsi a persone, animali o cose all'interno del perimetro della manifestazione.",
        punti: [
            { label: "Autoresponsabilità", testo: "Ogni partecipante accede all'Evento a proprio totale ed esclusivo rischio, rispondendo delle proprie condotte, condizioni fisiche e custodia dei propri beni." },
            { label: "Esclusione di custodia", testo: "Nessuna responsabilità per furti, atti vandalici, danneggiamenti o smarrimenti di attrezzature, effetti personali, denaro, merci o veicoli." },
            { label: "Infortuni", testo: "Non si risponde di infortuni o malori derivanti da condotte imprudenti, negligenza o dal mancato rispetto del presente Regolamento." },
            { label: "Vigilanza sui minori", testo: "La vigilanza dei minori è in capo esclusivo e permanente ai genitori, tutori o accompagnatori maggiorenni." },
            { label: "Malfunzionamenti della piattaforma online", testo: "Non si risponde di interruzioni o malfunzionamenti imputabili a terzi fornitori (PayPal, hosting, operatori di rete). Per transazioni parzialmente completate si applicano le disposizioni dell'Art. 2." },
        ]
    },
    {
        id: 'art10',
        numero: '10',
        titolo: "Privacy e Trattamento Dati (GDPR)",
        intro: "Il titolare del trattamento dei dati personali è l'Associazione Soul Volks. Il responsabile del sito è Alessandro Paolantonio. Per qualsiasi richiesta scrivere a info@soulvolks.it",
        introEmail: "info@soulvolks.it",
        punti: [
            { label: "Dati raccolti e finalità", testo: "In fase di acquisto vengono raccolti: nome, cognome, indirizzo email e dati di transazione elaborati da PayPal. Finalità: emissione del biglietto, comunicazioni operative, verifiche antifrode, adempimenti di legge." },
            { label: "Base giuridica", testo: "Esecuzione del contratto di acquisto (art. 6, par. 1, lett. b, Reg. UE 2016/679)." },
            { label: "Conservazione", testo: "I dati sono conservati per il tempo necessario alle finalità descritte e, successivamente, per i soli obblighi di legge (es. contabilità, fisco)." },
            { label: "Diritti dell'interessato", testo: "Hai diritto di accedere ai tuoi dati, richiederne la rettifica, la cancellazione, la limitazione del trattamento e la portabilità (artt. 15–20 Reg. UE 2016/679). Richieste a:", email: "info@soulvolks.it" },
            { label: "Diritti di immagine", testo: "Con l'accesso all'area, il partecipante acconsente alla ripresa fotografica e video da parte dell'Organizzazione o di terzi autorizzati, per finalità promozionali e archivistiche, senza limiti di tempo." },
        ]
    },
    {
        id: 'art11',
        numero: '11',
        titolo: "Modifiche al Regolamento",
        intro: "L'Organizzazione si riserva il diritto di apportare modifiche al presente Regolamento, dandone comunicazione tramite i canali ufficiali (soulvolks.it e profili social) con congruo preavviso. Modifiche sostanziali successive all'acquisto saranno comunicate direttamente via email.",
        punti: []
    },
    {
        id: 'art12',
        numero: '12',
        titolo: "Legge Applicabile e Foro Competente",
        intro: "Il presente Regolamento è disciplinato dalla legge italiana. Per qualsiasi controversia relativa all'interpretazione, esecuzione o risoluzione del contratto, le Parti riconoscono la competenza esclusiva del Foro di Campobasso (CB), salvo diversa disposizione inderogabile di legge a tutela del consumatore.",
        punti: []
    },
    {
        id: 'art13',
        numero: '13',
        titolo: "Accettazione Incondizionata",
        intro: "L'acquisto del biglietto tramite soulvolks.it, nonché il mero accesso fisico all'area del Terzo Matese Volks Camp, costituiscono accettazione integrale, incondizionata e consapevole di ogni articolo del presente Regolamento.",
        punti: [
            { label: "Sanzioni", testo: "L'inosservanza del Regolamento o condotte contrarie all'ordine pubblico conferiscono allo staff la facoltà insindacabile di disporre l'allontanamento immediato del trasgressore, riservandosi il diritto di adire le vie legali per il risarcimento di eventuali danni." },
        ]
    },
]

// Componente singolo punto accordion — completamente autonomo, nessun side effect esterno
function Punto({ label, testo, email }: { label: string; testo: string; email?: string }) {
    const [open, setOpen] = useState(false)
    return (
        <div style={{
            border: `1px solid ${open ? '#00435e' : '#ddd5be'}`,
            borderRadius: '6px',
            overflow: 'hidden',
            background: open ? '#f5f9fa' : '#fefcf6',
            transition: 'border-color 0.2s, background 0.2s',
        }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    gap: '1rem',
                }}
            >
                <span style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: open ? '#00435e' : '#15120d',
                    transition: 'color 0.2s',
                }}>
                    {label}
                </span>
                <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke={open ? '#00435e' : '#999'} strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, transition: 'transform 0.25s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
            {open && (
                <div style={{
                    padding: '0 1rem 1rem 1rem',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.85rem',
                    color: '#3a3028',
                    lineHeight: 1.8,
                }}>
                    {testo}{' '}
                    {email && (
                        <a href={`mailto:${email}`} style={{ color: '#e12713', fontWeight: 600, textDecoration: 'underline' }}>
                            {email}
                        </a>
                    )}
                </div>
            )}
        </div>
    )
}

// Componente articolo — nessun useEffect, nessun ref, nessuno scroll automatico
function Articolo({ art }: { art: typeof articoli[0] }) {
    return (
        <div
            id={art.id}
            style={{
                borderTop: '1px solid #e8e0cc',
                paddingTop: '2.5rem',
                marginBottom: '2.5rem',
                scrollMarginTop: '2rem',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1rem' }}>
                <span style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: '2.8rem',
                    color: '#e12713',
                    lineHeight: 1,
                    opacity: 0.18,
                    minWidth: '3.5rem',
                    userSelect: 'none',
                    transition: 'opacity 0.3s',
                }}>
                    {art.numero}
                </span>
                <h2 style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: '#15120d',
                    letterSpacing: '0.02em',
                    margin: 0,
                    textTransform: 'uppercase',
                    transition: 'color 0.3s',
                }}>
                    {art.titolo}
                </h2>
            </div>

            <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.9rem',
                color: '#3a3028',
                lineHeight: 1.8,
                marginBottom: art.punti.length > 0 ? '1.25rem' : 0,
            }}>
                {'introEmail' in art && art.introEmail
                    ? <>
                        {art.intro.replace(`info@soulvolks.it`, '').trimEnd()}{' '}
                        <a href={`mailto:${art.introEmail}`} style={{ color: '#e12713', fontWeight: 600, textDecoration: 'underline' }}>
                            {art.introEmail as string}
                        </a>
                    </>
                    : art.intro
                }
            </p>

            {art.punti.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {art.punti.map((punto, i) => (
                        <Punto key={i} label={punto.label} testo={punto.testo} email={'email' in punto ? punto.email as string : undefined} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default function TerminiPage() {
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: auto; } /* disabilitiamo lo scroll behavior globale, lo gestiamo noi */
        body { background: #fef9ec; color: #15120d; -webkit-overflow-scrolling: touch; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #f0e8d5; }
        ::-webkit-scrollbar-thumb { background: #c0a87a; border-radius: 3px; }
        .nav-btn {
          display: flex; align-items: flex-start; gap: 0.6rem;
          padding: 0.45rem 0.75rem; border-radius: 5px;
          cursor: pointer; border: none; background: none;
          text-align: left; width: 100%;
          transition: background 0.15s;
        }
      `}</style>

            <div style={{ minHeight: '100vh', background: '#fef9ec' }}>

                {/* Header */}
                <div style={{ background: '#15120d', padding: '3rem 2rem 2.5rem', borderBottom: '3px solid #e12713' }}>
                    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.15em', color: '#e12713', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                            Associazione Soul Volks
                        </p>
                        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(2rem, 5vw, 3.2rem)', color: '#fef9ec', fontWeight: 400, lineHeight: 1.1, marginBottom: '0.75rem' }}>
                            Termini e Condizioni
                        </h1>
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem', color: '#9a8e7a' }}>
                            Terzo Matese Volks Camp — Campitello Matese, 7–9 Agosto 2026 — Versione 1.0, Giugno 2026
                        </p>
                        <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                            <div>
                                <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.68rem', color: '#9a8e7a', marginBottom: '0.2rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Associazione Soul Volks</p>
                                <a href="mailto:info@soulvolks.it" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem', color: '#e12713', fontWeight: 600, textDecoration: 'none' }}>
                                    info@soulvolks.it
                                </a>
                            </div>
                            <div>
                                <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.68rem', color: '#9a8e7a', marginBottom: '0.2rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Responsabile del sito</p>
                                <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem', color: '#efeed7', fontWeight: 500 }}>Alessandro Paolantonio</p>
                            </div>
                            <div>
                                <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.68rem', color: '#9a8e7a', marginBottom: '0.2rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Titolare trattamento dati</p>
                                <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem', color: '#efeed7', fontWeight: 500 }}>Associazione Soul Volks</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Layout */}
                <div style={{
                    maxWidth: '1100px',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '3rem',
                    padding: '3rem 2rem',
                    alignItems: 'start',
                }}>

                    {/* Contenuto */}
                    <main>
                        {/* Avviso */}
                        <div style={{ background: '#15120d', borderRadius: '8px', padding: '1.25rem 1.5rem', marginBottom: '2rem', borderLeft: '4px solid #e12713' }}>
                            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem', color: '#efeed7', lineHeight: 1.7 }}>
                                <strong style={{ color: '#e12713' }}>Importante:</strong> L'acquisto del biglietto digitale su{' '}
                                <a href="https://soulvolks.it" style={{ color: '#efeed7', fontWeight: 600 }}>soulvolks.it</a>
                                {' '}e l'accesso fisico all'area dell'Evento costituiscono accettazione integrale e incondizionata di tutti gli articoli di seguito riportati.
                            </p>
                        </div>

                        {articoli.map(art => (
                            <Articolo key={art.id} art={art} />
                        ))}

                        {/* Footer */}
                        <div style={{ borderTop: '2px solid #15120d', paddingTop: '1.5rem', marginTop: '1rem' }}>
                            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.8rem', color: '#9a8e7a', marginBottom: '0.3rem' }}>
                                Associazione Soul Volks — Documento emesso Giugno 2026
                            </p>
                            <a href="https://soulvolks.it" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.8rem', color: '#e12713', textDecoration: 'none', fontWeight: 600 }}>
                                soulvolks.it
                            </a>
                        </div>
                    </main>
                </div>
            </div>
        </>
    )
}