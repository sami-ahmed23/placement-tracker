'use client'

import { useState } from 'react'
import { supabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid #222222',
  padding: '8px 0',
  fontSize: '12px',
  color: '#e8e8e8',
  outline: 'none',
  letterSpacing: '0.05em',
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitActive, setSubmitActive] = useState(false)
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
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080808',
        padding: '2rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <p
          style={{
            fontSize: '10px',
            color: '#444444',
            letterSpacing: '0.15em',
            margin: '0 0 8px 0',
          }}
        >
          {'>'} AUTH / PLACEMENT TRACKER
        </p>
        <h1
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#e8e8e8',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            margin: '0 0 2rem 0',
          }}
        >
          PLACEMENT TRACKER<span className="terminal-cursor" />
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span
              style={{
                fontSize: '10px',
                color: '#444444',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              Email
            </span>
            <input
              type="email"
              placeholder="user@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderBottomColor = '#00ffd1'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderBottomColor = '#222222'
              }}
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span
              style={{
                fontSize: '10px',
                color: '#444444',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              Password
            </span>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderBottomColor = '#00ffd1'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderBottomColor = '#222222'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLogin()
              }}
              style={inputStyle}
            />
          </label>

          {error && (
            <p
              style={{
                fontSize: '10px',
                color: '#664444',
                letterSpacing: '0.05em',
                margin: 0,
              }}
            >
              [ERROR] {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleLogin}
            onMouseEnter={() => setSubmitActive(true)}
            onMouseLeave={() => setSubmitActive(false)}
            onFocus={() => setSubmitActive(true)}
            onBlur={() => setSubmitActive(false)}
            style={{
              width: '100%',
              background: submitActive ? '#00ffd1' : 'transparent',
              border: '1px solid #222222',
              borderColor: submitActive ? '#00ffd1' : '#222222',
              color: submitActive ? '#080808' : '#e8e8e8',
              padding: '10px 0',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            [ SIGN IN ]
          </button>
        </div>
      </div>
    </main>
  )
}
