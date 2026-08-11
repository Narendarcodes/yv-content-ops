import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(true)
      return
    }
    setError(false)
    // Mock auth — real integration comes later
    navigate('/')
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="relative hidden w-[40%] flex-col justify-between overflow-hidden bg-cream p-12 lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-teal font-headline text-base font-bold text-on-accent">
            Aa
          </span>
          <span className="font-headline text-xl font-bold tracking-tight text-ink">Aaryajanani</span>
        </div>
        <div className="relative z-10">
          <h1 className="max-w-md font-headline text-4xl font-semibold leading-tight tracking-tight text-ink">
            Precision content operations and project memory for modern editorial teams
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-umber">
            Concepts, drafts, reviews and published projects — every decision, remembered.
          </p>
        </div>
        {/* Decorative organic blob */}
        <svg className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 text-teal/15" viewBox="0 0 400 400" fill="currentColor" aria-hidden="true">
          <path d="M390 210c-12 80-70 150-150 160-90 10-180-40-210-120C-10 160 30 60 110 40c80-20 180 20 210 70 20 30 70 60 70 100Z" />
        </svg>
        <p className="relative z-10 font-mono text-[10px] uppercase tracking-widest text-umber/60">
          Aaryajanani
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-sm fade-in">
          <div className="mb-8 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-teal font-headline text-base font-bold text-on-accent">
              Aa
            </span>
          </div>
          <h2 className="font-headline text-3xl font-semibold tracking-tight text-ink">Sign in to your workspace</h2>
          <p className="mt-1.5 text-sm text-umber">Welcome back. Pick up where you left off.</p>

          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="label">Work email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                className={`input ${error ? 'input-error' : ''}`}
              />
              {error && (
                <p className="mt-1.5 font-mono text-[11px] text-danger">Enter a valid work email</p>
              )}
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="label !mb-0">Password</label>
                <a href="#" className="text-xs text-teal hover:underline">Forgot password?</a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary w-full">Sign in</button>
          </form>

          <p className="mt-6 text-center text-sm text-umber">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-teal hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
