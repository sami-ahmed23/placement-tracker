'use client'

import { useState } from 'react'
import { supabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const FONT = '"JetBrains Mono", monospace'
const BG = '#080808'
const FG = '#e8e8e8'
const MUTED = '#444444'
const ACCENT = '#00FFD1'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0f0f0f',
  border: '1px solid #222222',
  borderRadius: 0,
  padding: '10px 12px',
  fontSize: '12px',
  fontFamily: FONT,
  color: FG,
  outline: 'none',
  letterSpacing: '0.05em',
  boxSizing: 'border-box',
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isReset, setIsReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    setError('')
    setSubmitting(true)

    if (isSignUp) {
      const { error } = await supabaseClient.auth.signUp({ email, password })
      setSubmitting(false)
      if (error) {
        setError(error.message)
        return
      }
      router.push('/')
      return
    }

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push('/')
  }

  async function handleGoogleSignIn() {
    setError('')
    setSubmitting(true)
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
    }
  }

  async function handleResetPassword() {
    setError('')
    setResetSent(false)
    setSubmitting(true)
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email)
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setResetSent(true)
  }

  function toggleMode() {
    setIsSignUp((prev) => !prev)
    setIsReset(false)
    setError('')
    setResetSent(false)
  }

  function enterResetMode() {
    setIsReset(true)
    setIsSignUp(false)
    setError('')
    setResetSent(false)
  }

  function exitResetMode() {
    setIsReset(false)
    setError('')
    setResetSent(false)
  }

  return (
    <>
      <style>{`
        @keyframes login-cursor-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .login-terminal-cursor {
          display: inline-block;
          width: 0.55em;
          height: 1em;
          margin-left: 2px;
          background: ${ACCENT};
          vertical-align: text-bottom;
          animation: login-cursor-blink 1s step-end infinite;
        }
      `}</style>

      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BG,
          padding: '2rem',
          fontFamily: FONT,
          color: FG,
        }}
      >
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h1
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: FG,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              margin: '0 0 8px 0',
              fontFamily: FONT,
            }}
          >
            PLACEMENT TRACKER
            <span className="login-terminal-cursor" />
          </h1>

          <p
            style={{
              fontSize: '10px',
              color: MUTED,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              margin: '0 0 2rem 0',
              fontFamily: FONT,
            }}
          >
            INTELLIGENCE DASHBOARD
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  color: MUTED,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  fontFamily: FONT,
                }}
              >
                EMAIL
              </span>
              <input
                type="email"
                placeholder="user@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = ACCENT
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#222222'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isReset) handleResetPassword()
                }}
                style={inputStyle}
              />
            </label>

            {!isReset && (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    color: MUTED,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    fontFamily: FONT,
                  }}
                >
                  PASSWORD
                </span>
                <input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = ACCENT
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#222222'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit()
                  }}
                  style={inputStyle}
                />
              </label>
            )}

            {error && (
              <p
                style={{
                  fontSize: '10px',
                  color: '#ff3333',
                  letterSpacing: '0.05em',
                  margin: 0,
                  fontFamily: FONT,
                }}
              >
                {error}
              </p>
            )}

            {resetSent && (
              <p
                style={{
                  fontSize: '10px',
                  color: ACCENT,
                  letterSpacing: '0.05em',
                  margin: 0,
                  fontFamily: FONT,
                }}
              >
                RESET EMAIL SENT. CHECK YOUR INBOX.
              </p>
            )}

            {isReset ? (
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={submitting}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: 'none',
                  borderRadius: 0,
                  color: '#000000',
                  padding: '12px 0',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  cursor: submitting ? 'wait' : 'pointer',
                  fontFamily: FONT,
                  marginTop: '0.5rem',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                SEND RESET EMAIL
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: 'none',
                  borderRadius: 0,
                  color: '#000000',
                  padding: '12px 0',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  cursor: submitting ? 'wait' : 'pointer',
                  fontFamily: FONT,
                  marginTop: '0.5rem',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {isSignUp ? 'REGISTER' : 'SIGN IN'}
              </button>
            )}

            {!isReset && !isSignUp && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    margin: '0.5rem 0',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: '1px',
                      background: '#222222',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '10px',
                      color: MUTED,
                      letterSpacing: '0.1em',
                      fontFamily: FONT,
                    }}
                  >
                    OR
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: '1px',
                      background: '#222222',
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    border: 'none',
                    borderRadius: 0,
                    color: '#000000',
                    padding: '12px 0',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    cursor: submitting ? 'wait' : 'pointer',
                    fontFamily: FONT,
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  SIGN IN WITH GOOGLE
                </button>
              </>
            )}

            {!isReset && (
              <button
                type="button"
                onClick={toggleMode}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 0 0 0',
                  fontSize: '10px',
                  color: MUTED,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: FONT,
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = ACCENT
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = MUTED
                }}
              >
                {isSignUp ? 'HAVE ACCOUNT? SIGN IN' : 'NO ACCOUNT? REGISTER'}
              </button>
            )}

            {!isReset && !isSignUp && (
              <button
                type="button"
                onClick={enterResetMode}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px 0 0 0',
                  fontSize: '10px',
                  color: MUTED,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: FONT,
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = ACCENT
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = MUTED
                }}
              >
                FORGOT PASSWORD?
              </button>
            )}

            {isReset && (
              <button
                type="button"
                onClick={exitResetMode}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 0 0 0',
                  fontSize: '10px',
                  color: MUTED,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: FONT,
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = ACCENT
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = MUTED
                }}
              >
                BACK TO SIGN IN
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
