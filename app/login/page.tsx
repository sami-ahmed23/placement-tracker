'use client'

import { useState } from 'react'
import { supabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin() {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      return
    }
    router.push('/')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-8 bg-zinc-900 rounded-lg space-y-4">
        <h1 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Placement Tracker</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          onClick={handleLogin}
          className="w-full bg-white text-black text-sm font-semibold py-2 rounded"
        >
          Sign in
        </button>
      </div>
    </main>
  )
}