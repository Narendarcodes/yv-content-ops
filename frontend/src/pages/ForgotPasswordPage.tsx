import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(true)
      return
    }
    setError(false)
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="brand-mark h-10 w-10 text-base">Fo</span>
          <span className="font-headline text-xl font-bold tracking-[-0.02em] text-ink">Folio</span>
        </div>

        {sent ? (
          <div className="stagger">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 size={22} strokeWidth={1.75} />
            </span>
            <h1 className="mt-5 font-headline text-[28px] font-semibold tracking-[-0.03em] text-ink">Check your inbox</h1>
            <p className="mt-2 text-sm leading-relaxed text-umber">
              If an account exists for <span className="font-medium text-ink">{email}</span>, we’ve sent a reset link. It
              expires in 30 minutes.
            </p>
            <Link to="/login" className="btn-primary mt-7 w-full">
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="stagger">
            <h1 className="font-headline text-[28px] font-semibold tracking-[-0.03em] text-ink">Reset your password</h1>
            <p className="mt-2 text-sm text-umber">Enter your work email and we’ll send you a reset link.</p>

            <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
              <div>
                <label htmlFor="fp-email" className="label">
                  Work email
                </label>
                <div className="relative">
                  <Mail size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-umber/50" />
                  <input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@studio.com"
                    className={`input !pl-10 ${error ? 'input-error' : ''}`}
                  />
                </div>
                {error && (
                  <p className="mt-1.5 font-mono text-[11px] text-danger" role="alert">
                    Enter a valid work email
                  </p>
                )}
              </div>
              <button type="submit" className="btn-primary w-full !h-11">
                Send reset link
              </button>
            </form>

            <Link
              to="/login"
              className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-teal transition-opacity hover:opacity-80"
            >
              <ArrowLeft size={14} strokeWidth={1.75} />
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}