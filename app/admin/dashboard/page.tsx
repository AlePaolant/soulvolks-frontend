'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Ticket, ShoppingBag, Download, LogOut, Menu, RefreshCw, Search, X } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

type Biglietto = {
    id: number
    documentId: string
    nome: string
    cognome: string
    email: string
    telefono: string
    targa: string
    tipo: string
    zona: string
    stato: string
    metodo_pagamento: string
    prezzo: number
    modello?: string
    anno?: number
    n_passeggeri: number
    uuid: string
    createdAt: string
}

type Stats = {
    totale: number
    incasso: number
    volkswagen: number
    standard: number
    pagati: number
    usati: number
    passeggeri: number
    oggi: number
    paypal: number
    contanti: number
    bonifico: number
    associati: number
}

type Sezione = 'dashboard' | 'biglietti' | 'cassa'
type Periodo = 'giorno' | 'settimana' | 'mese'

const navItems = [
    { key: 'dashboard' as Sezione, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'biglietti' as Sezione, label: 'Biglietti', icon: Ticket },
    { key: 'cassa' as Sezione, label: 'Cassa', icon: ShoppingBag },
]

function buildChartData(biglietti: Biglietto[], periodo: Periodo) {
    const now = new Date()
    const data: { label: string, biglietti: number, incasso: number }[] = []

    if (periodo === 'giorno') {
        // Ultimi 24 ore per ora
        for (let i = 23; i >= 0; i--) {
            const d = new Date(now)
            d.setHours(d.getHours() - i, 0, 0, 0)
            const label = `${d.getHours()}:00`
            const count = biglietti.filter(b => {
                const bd = new Date(b.createdAt)
                return bd.getHours() === d.getHours() && bd.toDateString() === d.toDateString()
            })
            data.push({ label, biglietti: count.length, incasso: count.reduce((a, b) => a + b.prezzo, 0) })
        }
    } else if (periodo === 'settimana') {
        // Ultimi 7 giorni
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(d.getDate() - i)
            const label = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })
            const count = biglietti.filter(b => new Date(b.createdAt).toDateString() === d.toDateString())
            data.push({ label, biglietti: count.length, incasso: count.reduce((a, b) => a + b.prezzo, 0) })
        }
    } else {
        // Ultimi 30 giorni
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(d.getDate() - i)
            const label = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
            const count = biglietti.filter(b => new Date(b.createdAt).toDateString() === d.toDateString())
            data.push({ label, biglietti: count.length, incasso: count.reduce((a, b) => a + b.prezzo, 0) })
        }
    }

    return data
}

export default function AdminDashboard() {
    const router = useRouter()
    const now = new Date()
    const [sezione, setSezione] = useState<Sezione>('dashboard')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [biglietti, setBiglietti] = useState<Biglietto[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [bigliettoSelezionato, setBigliettoSelezionato] = useState<Biglietto | null>(null)
    const [periodo, setPeriodo] = useState<Periodo>('settimana')
    const [filtro, setFiltro] = useState('')

    const fetchBiglietti = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/biglietti')
            const data = await res.json()
            setBiglietti(data.biglietti || [])
            setStats(data.stats)
        } catch { }
        setLoading(false)
    }, [])

    useEffect(() => { fetchBiglietti() }, [fetchBiglietti])

    const handleLogout = async () => {
        await fetch('/api/admin/logout', { method: 'POST' })
        router.push('/admin')
    }

    const handleExportCSV = () => {
        const headers = ['Nome', 'Cognome', 'Email', 'Telefono', 'Tipo', 'Zona', 'Targa', 'Modello', 'Anno', 'Passeggeri', 'Stato', 'Metodo', 'Prezzo', 'UUID', 'Data']
        const rows = biglietti.map(b => [
            b.nome, b.cognome, b.email, b.telefono,
            b.tipo, b.zona, b.targa, b.modello || '', b.anno || '',
            b.n_passeggeri, b.stato, b.metodo_pagamento, b.prezzo,
            b.uuid, new Date(b.createdAt).toLocaleDateString('it-IT')
        ])
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `biglietti-mvc2026-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
    }

    const bigliettiFiltered = biglietti
        .filter(b => `${b.nome} ${b.cognome} ${b.targa} ${b.email}`.toLowerCase().includes(search.toLowerCase()))
        .filter(b => {
            if (!filtro) return true
            if (filtro === 'pagato' || filtro === 'usato') return b.stato === filtro
            if (filtro === 'volkswagen' || filtro === 'standard') return b.tipo === filtro
            if (filtro === 'A' || filtro === 'B') return b.zona === filtro
            return true
        })

    const chartData = buildChartData(biglietti, periodo)


    return (
        <div className="min-h-screen bg-[var(--panna)] flex">

            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* SIDEBAR */}
            <aside className={`fixed md:static inset-y-0 left-0 z-30 w-60 bg-[var(--scuro)] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                }`}>

                {/* Logo + orologio */}
                <div className="px-5 py-6 border-b border-[var(--panna-chiaro)]/10">
                    <p className="font-poppins font-black text-[var(--panna-chiaro)] text-base uppercase tracking-wider">Soul Volks</p>
                    <p className="font-poppins text-[10px] text-[var(--panna-chiaro)]/30 uppercase tracking-[0.3em] mt-0.5">Admin Panel</p>
                    <div className="mt-4 pt-4 border-t border-[var(--panna-chiaro)]/10">
                        <p className="font-poppins text-xs text-[var(--panna-chiaro)]/30 capitalize" suppressHydrationWarning>
                            {now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map(item => {
                        const Icon = item.icon
                        const active = sezione === item.key
                        return (
                            <button key={item.key}
                                onClick={() => { setSezione(item.key); setSidebarOpen(false) }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-poppins text-sm font-medium ${active
                                    ? 'bg-[var(--rosso)] text-white'
                                    : 'text-[var(--panna-chiaro)]/40 hover:text-[var(--panna-chiaro)] hover:bg-[var(--panna-chiaro)]/5'
                                    }`}>
                                <Icon size={16} />
                                {item.label}
                            </button>
                        )
                    })}
                </nav>

                <div className="px-3 py-4 border-t border-[var(--panna-chiaro)]/10">
                    <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--panna-chiaro)]/30 hover:text-[var(--panna-chiaro)] hover:bg-[var(--panna-chiaro)]/5 transition-all font-poppins text-sm">
                        <LogOut size={16} />
                        Esci
                    </button>
                </div>
            </aside>

            {/* CONTENUTO */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Topbar mobile */}
                <div className="md:hidden bg-[var(--scuro)] px-4 py-4 flex items-center justify-between border-b border-[var(--panna-chiaro)]/10">
                    <button onClick={() => setSidebarOpen(true)} className="text-[var(--panna-chiaro)]/60 hover:text-[var(--panna-chiaro)]">
                        <Menu size={20} />
                    </button>
                    <p className="font-poppins font-black text-[var(--panna-chiaro)] text-sm uppercase tracking-wider">
                        {navItems.find(n => n.key === sezione)?.label}
                    </p>
                    <div className="w-5" />
                </div>

                <div className="flex-1 p-6 md:p-8 overflow-auto">

                    {/* DASHBOARD */}
                    {sezione === 'dashboard' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="font-poppins font-black text-gray-900 text-xl uppercase tracking-wider">Dashboard</h2>
                                <button onClick={fetchBiglietti}
                                    className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors font-poppins text-xs uppercase tracking-widest">
                                    <RefreshCw size={13} />
                                    Aggiorna
                                </button>
                            </div>

                            {loading ? (
                                <p className="font-poppins text-sm text-gray-400 uppercase tracking-widest animate-pulse">Caricamento...</p>
                            ) : stats && (<>

                                {/* Stat cards principali */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Biglietti totali', value: stats.totale, sub: `${stats.pagati} da usare · ${stats.usati} usati`, bg: 'bg-blue-600', text: 'text-white', subtext: 'text-blue-200' },
                                        { label: 'Incasso totale', value: `€${stats.incasso}`, sub: `media €${stats.totale ? Math.round(stats.incasso / stats.totale) : 0}/biglietto`, bg: 'bg-emerald-600', text: 'text-white', subtext: 'text-emerald-200' },
                                        { label: 'Passeggeri attesi', value: stats.passeggeri, sub: 'somma passeggeri dichiarati', bg: 'bg-white border border-gray-200', text: 'text-gray-900', subtext: 'text-gray-400' },
                                        { label: 'Venduti oggi', value: stats.oggi, sub: new Date().toLocaleDateString('it-IT'), bg: 'bg-white border border-gray-200', text: 'text-gray-900', subtext: 'text-gray-400' },
                                    ].map(stat => (
                                        <div key={stat.label} className={`rounded-2xl p-5 ${stat.bg}`}>
                                            <p className={`font-poppins text-[10px] uppercase tracking-[0.25em] mb-2 ${stat.subtext}`}>{stat.label}</p>
                                            <p className={`font-poppins font-black text-3xl ${stat.text}`}>{stat.value}</p>
                                            <p className={`font-poppins text-[10px] mt-1 ${stat.subtext}`}>{stat.sub}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Metodi pagamento */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { label: 'PayPal', value: stats.paypal },
                                        { label: 'Contanti', value: stats.contanti },
                                        { label: 'Bonifico', value: stats.bonifico },
                                        { label: 'Associati', value: stats.associati },
                                    ].map(stat => (
                                        <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-5">
                                            <p className="font-poppins text-[10px] uppercase tracking-[0.25em] text-gray-400 mb-2">{stat.label}</p>
                                            <p className="font-poppins font-black text-2xl text-gray-900">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Grafici */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                    {/* Grafico torta */}
                                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                        <p className="font-poppins font-bold text-sm text-gray-700 uppercase tracking-wider mb-4">Tipo veicolo</p>
                                        <div className="flex flex-col gap-3">
                                            {[
                                                { label: 'Volkswagen', value: stats.volkswagen, color: 'bg-blue-500', pct: Math.round(stats.volkswagen / (stats.totale || 1) * 100) },
                                                { label: 'Camper / Tenda', value: stats.standard, color: 'bg-orange-400', pct: Math.round(stats.standard / (stats.totale || 1) * 100) },
                                            ].map(item => (
                                                <div key={item.label}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-poppins text-xs text-gray-600">{item.label}</span>
                                                        <span className="font-poppins font-bold text-sm text-gray-900">{item.value} <span className="text-gray-400 font-normal">({item.pct}%)</span></span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                                        <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Mini torta SVG */}
                                        <div className="flex justify-center mt-6">
                                            <svg viewBox="0 0 100 100" className="w-28 h-28">
                                                {stats.totale > 0 ? (() => {
                                                    const vwPct = stats.volkswagen / stats.totale
                                                    const angle = vwPct * 2 * Math.PI
                                                    const x = 50 + 40 * Math.sin(angle)
                                                    const y = 50 - 40 * Math.cos(angle)
                                                    const large = vwPct > 0.5 ? 1 : 0
                                                    return (
                                                        <>
                                                            <circle cx="50" cy="50" r="40" fill="#fb923c" />
                                                            {vwPct > 0 && vwPct < 1 && (
                                                                <path d={`M50,50 L50,10 A40,40 0 ${large},1 ${x},${y} Z`} fill="#3b82f6" />
                                                            )}
                                                            {vwPct === 1 && <circle cx="50" cy="50" r="40" fill="#3b82f6" />}
                                                            <circle cx="50" cy="50" r="22" fill="white" />
                                                            <text x="50" y="46" textAnchor="middle" className="font-poppins" style={{ fontSize: '10px', fill: '#374151', fontFamily: 'Poppins' }}>VW</text>
                                                            <text x="50" y="58" textAnchor="middle" style={{ fontSize: '12px', fill: '#111827', fontWeight: 'bold', fontFamily: 'Poppins' }}>{Math.round(vwPct * 100)}%</text>                                                        </>
                                                    )
                                                })() : <circle cx="50" cy="50" r="40" fill="#f3f4f6" />}
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Grafico temporale */}
                                    <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="font-poppins font-bold text-sm text-gray-700 uppercase tracking-wider">Vendite nel tempo</p>
                                            <div className="flex gap-1">
                                                {(['giorno', 'settimana', 'mese'] as Periodo[]).map(p => (
                                                    <button key={p} onClick={() => setPeriodo(p)}
                                                        className={`px-3 py-1 rounded-lg font-poppins text-xs uppercase tracking-wider transition-all ${periodo === p ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700'
                                                            }`}>
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                                <XAxis dataKey="label" tick={{ fontFamily: 'Poppins', fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                                <YAxis tick={{ fontFamily: 'Poppins', fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                                <Tooltip
                                                    contentStyle={{ fontFamily: 'Poppins', fontSize: 11, border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                                    formatter={(value: any, name: any) => [value, name === 'biglietti' ? 'Biglietti' : 'Incasso €']} />
                                                <Area type="monotone" dataKey="biglietti" stroke="#2563eb" strokeWidth={2} fill="rgba(37,99,235,0.08)" dot={false} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                </div>

                                <button onClick={handleExportCSV}
                                    className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 font-poppins font-bold uppercase tracking-[0.15em] text-xs hover:bg-gray-700 transition-colors rounded-xl">
                                    <Download size={14} />
                                    Esporta CSV
                                </button>

                            </>)}
                        </div>
                    )}

                    {/* BIGLIETTI */}
                    {sezione === 'biglietti' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="font-poppins font-black text-[var(--nero)] text-2xl uppercase tracking-wider">Biglietti</h2>
                                <div className="flex items-center gap-3">
                                    <span className="font-poppins text-xs text-[var(--nero)]/40">{bigliettiFiltered.length} risultati</span>
                                    <button onClick={fetchBiglietti}
                                        className="flex items-center gap-1 text-[var(--nero)]/40 hover:text-[var(--nero)] transition-colors font-poppins text-xs uppercase tracking-widest">
                                        <RefreshCw size={13} />
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--nero)]/30" />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Cerca per nome, targa, email..."
                                    className="w-full bg-white border border-[var(--nero)]/10 rounded-xl pl-10 pr-4 py-3 font-poppins text-sm text-[var(--nero)] outline-none focus:border-[var(--rosso)] transition-colors" />
                            </div>

                            {/* Filtri */}
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { label: 'Tutti', value: '' },
                                    { label: 'Pagati', value: 'pagato' },
                                    { label: 'Usati', value: 'usato' },
                                    { label: 'Volkswagen', value: 'volkswagen' },
                                    { label: 'Camper/Tenda', value: 'standard' },
                                    { label: 'Zona A', value: 'A' },
                                    { label: 'Zona B', value: 'B' },
                                ].map(f => (
                                    <button key={f.value}
                                        onClick={() => setFiltro(f.value)}
                                        className={`px-3 py-1.5 rounded-lg font-poppins text-xs uppercase tracking-wider transition-all ${filtro === f.value
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
                                            }`}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {loading ? (
                                <p className="font-poppins text-sm text-[var(--nero)]/40 uppercase tracking-widest animate-pulse">Caricamento...</p>
                            ) : (
                                <div className="space-y-2">
                                    {bigliettiFiltered.map(b => (
                                        <div key={b.id} onClick={() => setBigliettoSelezionato(b)}
                                            className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all">

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <p className="font-poppins font-bold text-[var(--nero)] text-sm">{b.nome} {b.cognome}</p>
                                                    <span className={`px-2 py-0.5 text-[9px] font-poppins font-black uppercase rounded-full ${b.stato === 'usato' ? 'bg-[var(--bordeaux)]/10 text-[var(--bordeaux)]' : 'bg-green-100 text-green-700'
                                                        }`}>{b.stato}</span>
                                                    <span className={`px-2 py-0.5 text-[9px] font-poppins font-black uppercase rounded-full ${b.zona === 'A' ? 'bg-[var(--petrolio)]/10 text-[var(--petrolio)]' : 'bg-orange-100 text-orange-700'
                                                        }`}>Zona {b.zona}</span>
                                                </div>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className="font-poppins text-xs text-[var(--nero)]/40 uppercase">{b.targa}</span>
                                                    <span className="font-poppins text-xs text-[var(--nero)]/40">{b.metodo_pagamento}</span>
                                                    <span className="font-poppins text-xs text-[var(--nero)]/40">{new Date(b.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                            <p className="font-poppins font-black text-[var(--rosso)] shrink-0 text-sm">€{b.prezzo}</p>
                                        </div>
                                    ))}
                                    {bigliettiFiltered.length === 0 && (
                                        <p className="font-poppins text-sm text-[var(--nero)]/40 text-center py-16 uppercase tracking-widest">Nessun biglietto trovato</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* CASSA */}
                    {sezione === 'cassa' && <CassaForm onSuccess={fetchBiglietti} />}

                </div>
            </div>

            {/* Modal dettaglio biglietto */}
            {bigliettoSelezionato && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4"
                    onClick={() => setBigliettoSelezionato(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4"
                        onClick={e => e.stopPropagation()}>

                        <div className="flex items-center justify-between">
                            <p className="font-poppins font-black text-gray-900 uppercase tracking-wider">Dettaglio biglietto</p>
                            <button onClick={() => setBigliettoSelezionato(null)} className="text-gray-400 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-1">
                            {[
                                { label: 'Nome', value: `${bigliettoSelezionato.nome} ${bigliettoSelezionato.cognome}` },
                                { label: 'Email', value: bigliettoSelezionato.email },
                                { label: 'Telefono', value: bigliettoSelezionato.telefono },
                                { label: 'Targa', value: bigliettoSelezionato.targa.toUpperCase() },
                                { label: 'Tipo', value: bigliettoSelezionato.tipo === 'volkswagen' ? 'Volkswagen' : 'Camper / Tenda' },
                                { label: 'Zona', value: `Zona ${bigliettoSelezionato.zona}` },
                                { label: 'Passeggeri', value: String(bigliettoSelezionato.n_passeggeri) },
                                ...(bigliettoSelezionato.modello ? [{ label: 'Veicolo', value: `${bigliettoSelezionato.modello} ${bigliettoSelezionato.anno || ''}` }] : []),
                                { label: 'Metodo', value: bigliettoSelezionato.metodo_pagamento },
                                { label: 'Stato', value: bigliettoSelezionato.stato },
                                { label: 'UUID', value: bigliettoSelezionato.uuid },
                                { label: 'Data', value: new Date(bigliettoSelezionato.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between items-start py-2 border-b border-gray-100">
                                    <span className="font-poppins text-xs uppercase tracking-[0.2em] text-gray-400 shrink-0 mr-4">{item.label}</span>
                                    <span className="font-poppins text-sm font-medium text-gray-900 text-right break-all">{item.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <a href={`mailto:${bigliettoSelezionato.email}`}
                                className="flex-1 py-3 bg-gray-900 text-white font-poppins font-bold text-xs uppercase tracking-widest rounded-xl text-center hover:bg-gray-700 transition-colors">
                                Scrivi email
                            </a>
                            <a href={`tel:${bigliettoSelezionato.telefono}`}
                                className="flex-1 py-3 border border-gray-200 text-gray-700 font-poppins font-bold text-xs uppercase tracking-widest rounded-xl text-center hover:border-gray-400 transition-colors">
                                Chiama
                            </a>
                        </div>
                    </div>
                </div>
            )
            }
        </div>
    )
}

function CassaForm({ onSuccess }: { onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        nome: '', cognome: '', email: '', telefono: '',
        n_passeggeri: '1', targa: '', tipo: 'standard' as 'volkswagen' | 'standard',
        modello: '', anno: '', note: '', metodo_pagamento: 'contanti',
    })
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState<{ uuid: string } | null>(null)
    const [error, setError] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/admin/cassa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setSuccess({ uuid: data.uuid })
            onSuccess()
        } catch (err: any) {
            setError(err.message || 'Errore creazione biglietto')
        } finally {
            setLoading(false)
        }
    }

    const inputClass = "w-full bg-[var(--panna)] border border-[var(--nero)]/10 rounded-xl px-4 py-3 font-poppins text-sm text-[var(--nero)] outline-none focus:border-[var(--rosso)] transition-colors"
    const labelClass = "block font-poppins text-[10px] uppercase tracking-[0.25em] text-[var(--nero)]/50 mb-1"

    if (success) {
        return (
            <div className="max-w-md space-y-6">
                <h2 className="font-poppins font-black text-[var(--nero)] text-2xl uppercase tracking-wider">Biglietto creato</h2>
                <div className="bg-white border-2 border-[var(--nero)] rounded-2xl p-8">
                    <p className="font-poppins text-[10px] uppercase tracking-[0.3em] text-[var(--nero)]/40 mb-3">Codice biglietto</p>
                    <p className="font-mono font-bold text-[var(--rosso)] break-all text-sm">{success.uuid}</p>
                </div>
                <button onClick={() => setSuccess(null)}
                    className="w-full py-4 bg-[var(--nero)] text-[var(--panna)] font-poppins font-black uppercase tracking-[0.15em] text-sm hover:bg-[var(--rosso)] transition-colors rounded-xl">
                    Nuovo biglietto
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-2xl space-y-6">
            <h2 className="font-poppins font-black text-[var(--nero)] text-2xl uppercase tracking-wider">Cassa</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { value: 'volkswagen', label: 'Volkswagen', sub: 'Zona A' },
                        { value: 'standard', label: 'Camper / Tenda', sub: 'Zona B' },
                    ].map(opt => (
                        <button key={opt.value} type="button"
                            onClick={() => setFormData({ ...formData, tipo: opt.value as any })}
                            className={`p-5 border-2 rounded-xl text-left transition-all ${formData.tipo === opt.value
                                ? 'border-[var(--nero)] bg-[var(--nero)] text-[var(--panna)]'
                                : 'border-[var(--nero)]/10 bg-white hover:border-[var(--nero)]/30'
                                }`}>
                            <p className="font-poppins font-black text-sm uppercase tracking-wider">{opt.label}</p>
                            <p className={`font-poppins text-xs mt-1 ${formData.tipo === opt.value ? 'text-[var(--panna)]/50' : 'text-[var(--nero)]/40'}`}>{opt.sub}</p>
                        </button>
                    ))}
                </div>

                <div>
                    <label className={labelClass}>Metodo pagamento *</label>
                    <select name="metodo_pagamento" value={formData.metodo_pagamento} onChange={handleChange} className={inputClass}>
                        <option value="contanti">Contanti</option>
                        <option value="bonifico">Bonifico</option>
                        <option value="associato">Associato (gratuito)</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelClass}>Nome *</label><input name="nome" value={formData.nome} onChange={handleChange} required className={inputClass} /></div>
                    <div><label className={labelClass}>Cognome *</label><input name="cognome" value={formData.cognome} onChange={handleChange} required className={inputClass} /></div>
                    <div><label className={labelClass}>Email</label><input name="email" type="email" value={formData.email} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Telefono *</label><input name="telefono" value={formData.telefono} onChange={handleChange} required className={inputClass} /></div>
                    <div><label className={labelClass}>N° Passeggeri *</label><input name="n_passeggeri" type="number" min="1" max="9" value={formData.n_passeggeri} onChange={handleChange} required className={inputClass} /></div>
                    <div><label className={labelClass}>Targa *</label><input name="targa" value={formData.targa} onChange={handleChange} required className={`${inputClass} uppercase`} placeholder="es. AB123CD" /></div>
                </div>

                {formData.tipo === 'volkswagen' && (
                    <div className="grid grid-cols-2 gap-4 p-6 bg-[var(--nero)] rounded-2xl">
                        <div>
                            <label className="block font-poppins text-[10px] uppercase tracking-[0.25em] text-[var(--panna-chiaro)]/50 mb-1">Modello *</label>
                            <input name="modello" value={formData.modello} onChange={handleChange} required
                                className="w-full bg-transparent border-b border-[var(--panna-chiaro)]/20 px-0 py-2 text-[var(--panna-chiaro)] font-poppins text-sm outline-none focus:border-[var(--rosso)] transition-colors"
                                placeholder="es. Maggiolino" />
                        </div>
                        <div>
                            <label className="block font-poppins text-[10px] uppercase tracking-[0.25em] text-[var(--panna-chiaro)]/50 mb-1">Anno *</label>
                            <input name="anno" type="number" min="1945" max="1995" value={formData.anno} onChange={handleChange} required
                                className="w-full bg-transparent border-b border-[var(--panna-chiaro)]/20 px-0 py-2 text-[var(--panna-chiaro)] font-poppins text-sm outline-none focus:border-[var(--rosso)] transition-colors"
                                placeholder="es. 1972" />
                        </div>
                    </div>
                )}

                {error && <p className="font-poppins text-xs text-[var(--rosso)]">{error}</p>}

                <button type="submit" disabled={loading}
                    className="w-full py-4 bg-[var(--rosso)] text-white font-poppins font-black uppercase tracking-[0.15em] text-sm hover:bg-[var(--bordeaux)] transition-colors rounded-xl disabled:opacity-50">
                    {loading ? 'Creazione...' : 'Crea biglietto'}
                </button>
            </form>
        </div>
    )
}