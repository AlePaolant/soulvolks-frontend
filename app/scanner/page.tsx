'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { CheckCircle, XCircle, RefreshCw, MapPin, Car, Tent } from 'lucide-react'

type Biglietto = {
    id: number
    documentId: string
    nome: string
    cognome: string
    targa: string
    tipo: string
    zona: string
    stato: string
    modello?: string
    anno?: number
    n_passeggeri: number
}

type ScanState = 'scanning' | 'loading' | 'found' | 'error' | 'already_used'

export default function ScannerPage() {
    const [scanState, setScanState] = useState<ScanState>('scanning')
    const [biglietto, setBiglietto] = useState<Biglietto | null>(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [updating, setUpdating] = useState(false)
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const scannerStarted = useRef(false)

    useEffect(() => {
        startScanner()
        return () => {
            // Cleanup sincrono
            if (scannerRef.current) {
                try {
                    scannerRef.current.stop().catch(() => { })
                    scannerRef.current.clear()
                } catch { }
                scannerRef.current = null
                scannerStarted.current = false
            }
        }
    }, [])

    const startScanner = async () => {
        if (scannerStarted.current) return

        try {
            // Pulisci il div prima di ricreare lo scanner
            const element = document.getElementById('qr-reader')
            if (element) element.innerHTML = ''

            const scanner = new Html5Qrcode('qr-reader')
            scannerRef.current = scanner
            scannerStarted.current = true

            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (decodedText) => {
                    await scanner.pause()
                    await handleScan(decodedText)
                },
                () => { }
            )
        } catch (err) {
            setErrorMsg('Impossibile accedere alla fotocamera. Verifica i permessi.')
            setScanState('error')
        }
    }

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState()
                if (state === 2) { // SCANNING
                    await scannerRef.current.stop()
                }
                scannerRef.current.clear()
            } catch { }
            scannerRef.current = null
            scannerStarted.current = false
        }
    }

    const handleReset = async () => {
        await stopScanner()
        setBiglietto(null)
        setErrorMsg('')
        setScanState('scanning')
        // Piccolo delay per dare tempo al browser di rilasciare la camera
        setTimeout(() => {
            startScanner()
        }, 500)
    }

    const handleScan = async (uuid: string) => {
        setScanState('loading')
        try {
            const res = await fetch(`/api/scanner/cerca?uuid=${encodeURIComponent(uuid)}`)
            const data = await res.json()

            if (!res.ok || !data.biglietto) {
                setErrorMsg('Biglietto non trovato.')
                setScanState('error')
                return
            }

            setBiglietto(data.biglietto)

            if (data.biglietto.stato === 'usato') {
                setScanState('already_used')
            } else {
                setScanState('found')
            }
        } catch {
            setErrorMsg('Errore di connessione.')
            setScanState('error')
        }
    }


    const handleSegnaUsato = async () => {
        if (!biglietto) return
        setUpdating(true)
        try {
            const res = await fetch('/api/scanner/aggiorna', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: biglietto.documentId }),
            })
            if (!res.ok) throw new Error()
            setScanState('already_used')
            setBiglietto({ ...biglietto, stato: 'usato' })
        } catch {
            setErrorMsg('Errore aggiornamento biglietto.')
        } finally {
            setUpdating(false)
        }
    }

    return (
        <main className="min-h-screen bg-[var(--scuro)] text-[var(--panna-chiaro)]">

            {/* Header */}
            <div className="border-b border-[var(--panna-chiaro)]/10 px-6 py-5 flex items-center justify-between">
                <div>
                    <p className="font-poppins font-black text-lg uppercase tracking-wider">Soul Volks</p>
                    <p className="font-poppins text-xs text-[var(--panna-chiaro)]/30 uppercase tracking-widest">Scanner biglietti</p>
                </div>
                <button onClick={handleReset}
                    className="flex items-center gap-2 text-[var(--panna-chiaro)]/40 hover:text-[var(--panna-chiaro)] transition-colors">
                    <RefreshCw size={16} />
                    <span className="font-poppins text-xs uppercase tracking-widest">Reset</span>
                </button>
            </div>

            <div className="max-w-md mx-auto px-6 py-8">

                {/* Scanner */}
                {scanState === 'scanning' && (
                    <div>
                        <p className="font-poppins text-xs uppercase tracking-[0.3em] text-[var(--panna-chiaro)]/30 mb-6 text-center">
                            Inquadra il QR code del biglietto
                        </p>
                        <div id="qr-reader" className="rounded-xl overflow-hidden" />
                    </div>
                )}

                {/* Loading */}
                {scanState === 'loading' && (
                    <div className="text-center py-20">
                        <p className="font-poppins text-sm uppercase tracking-widest text-[var(--panna-chiaro)]/40 animate-pulse">
                            Verifica in corso...
                        </p>
                    </div>
                )}

                {/* Biglietto trovato — valido */}
                {(scanState === 'found' || scanState === 'already_used') && biglietto && (
                    <div>
                        {/* Status badge */}
                        <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${scanState === 'already_used'
                            ? 'bg-[var(--bordeaux)]/20 border border-[var(--bordeaux)]'
                            : 'bg-green-900/20 border border-green-600'
                            }`}>
                            {scanState === 'already_used'
                                ? <XCircle size={24} className="text-[var(--bordeaux)]" />
                                : <CheckCircle size={24} className="text-green-500" />
                            }
                            <div>
                                <p className="font-poppins font-black text-lg uppercase">
                                    {scanState === 'already_used' ? 'Già utilizzato' : 'Biglietto valido'}
                                </p>
                                <p className="font-poppins text-xs text-[var(--panna-chiaro)]/40 uppercase tracking-widest">
                                    {scanState === 'already_used' ? 'Questo biglietto è già stato scansionato' : 'Biglietto non ancora utilizzato'}
                                </p>
                            </div>
                        </div>

                        {/* Zona — grande e visibile */}
                        <div className={`p-8 rounded-xl mb-6 text-center ${biglietto.zona === 'A' ? 'bg-[var(--petrolio)]' : 'bg-[var(--arancione)]'
                            }`}>
                            <p className="font-poppins text-xs uppercase tracking-[0.4em] text-[var(--panna-chiaro)]/40 mb-2">
                                Parcheggio
                            </p>
                            <p className="font-poppins text-[var(--panna-chiaro)] leading-none"
                                style={{ fontSize: '6rem' }}>
                                {biglietto.zona === 'A' ? 'A' : 'B'}
                            </p>
                            <p className="font-poppins text-sm text-[var(--panna-chiaro)]/60 mt-2 uppercase tracking-widest">
                                {biglietto.zona === 'A' ? 'Zona Volkswagen' : 'Area Camping'}
                            </p>
                        </div>

                        {/* Dettagli */}
                        <div className="space-y-3 mb-8">
                            {[
                                { label: 'Intestatario', value: `${biglietto.nome} ${biglietto.cognome}` },
                                { label: 'Targa', value: biglietto.targa.toUpperCase() },
                                { label: 'Tipo', value: biglietto.tipo === 'volkswagen' ? 'Volkswagen' : 'Camper / Tenda' },
                                ...(biglietto.modello ? [{ label: 'Veicolo', value: `${biglietto.modello} ${biglietto.anno || ''}` }] : []),
                                { label: 'Passeggeri', value: String(biglietto.n_passeggeri) },
                            ].map((item) => (
                                <div key={item.label} className="flex justify-between items-baseline py-3 border-b border-[var(--panna-chiaro)]/10">
                                    <span className="font-poppins text-xs uppercase tracking-[0.2em] text-[var(--panna-chiaro)]/30">{item.label}</span>
                                    <span className="font-poppins font-semibold text-[var(--panna-chiaro)]">{item.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Bottoni */}
                        <div className="space-y-3">
                            {scanState === 'found' && (
                                <button onClick={handleSegnaUsato} disabled={updating}
                                    className="w-full py-5 bg-green-700 hover:bg-green-600 text-white font-poppins font-black uppercase tracking-[0.15em] text-sm rounded-xl transition-colors disabled:opacity-50">
                                    {updating ? 'Aggiornamento...' : '✓ Segna come usato'}
                                </button>
                            )}
                            <button onClick={handleReset}
                                className="w-full py-4 border border-[var(--panna-chiaro)]/20 text-[var(--panna-chiaro)]/50 hover:text-[var(--panna-chiaro)] hover:border-[var(--panna-chiaro)]/40 font-poppins font-black uppercase tracking-[0.15em] text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                                <RefreshCw size={16} />
                                Scansiona di nuovo
                            </button>
                        </div>
                    </div>
                )}

                {/* Errore */}
                {scanState === 'error' && (
                    <div className="text-center py-12">
                        <XCircle size={48} className="text-[var(--bordeaux)] mx-auto mb-4" />
                        <p className="font-poppins font-bold text-lg text-[var(--panna-chiaro)] mb-2">Errore</p>
                        <p className="font-poppins text-sm text-[var(--panna-chiaro)]/40 mb-8">{errorMsg}</p>
                        <button onClick={handleReset}
                            className="flex items-center gap-2 mx-auto text-[var(--panna-chiaro)]/40 hover:text-[var(--panna-chiaro)] transition-colors font-poppins text-sm uppercase tracking-widest">
                            <RefreshCw size={16} />
                            Riprova
                        </button>
                    </div>
                )}

            </div>
        </main>
    )
}