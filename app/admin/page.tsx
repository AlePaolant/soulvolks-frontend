'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/admin/dashboard')
    } else {
      setError('Password errata')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[var(--scuro)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="font-poppins font-black text-2xl text-[var(--panna-chiaro)] uppercase tracking-wider mb-1">Soul Volks</p>
          <p className="font-poppins text-xs text-[var(--panna-chiaro)]/30 uppercase tracking-[0.3em]">Pannello Admin</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block font-poppins text-xs uppercase tracking-[0.2em] text-[var(--panna-chiaro)]/40 mb-2">
              <Lock size={10} className="inline mr-1" />Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-transparent border-b-2 border-[var(--panna-chiaro)]/20 px-0 py-3 text-[var(--panna-chiaro)] outline-none focus:border-[var(--rosso)] transition-colors font-poppins text-base"
            />
          </div>

          {error && <p className="font-poppins text-xs text-[var(--rosso)]">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-[var(--rosso)] text-white font-poppins font-black uppercase tracking-[0.15em] text-sm hover:bg-[var(--bordeaux)] transition-colors disabled:opacity-50">
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </main>
  )
}