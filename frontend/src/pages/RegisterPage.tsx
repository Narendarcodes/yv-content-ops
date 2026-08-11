import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function strength(password: string): { label: string; pct: number; tone: string } {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const map = [
    { label: 'Weak', pct: 25, tone: 'bg-danger' },
    { label: 'Fair', pct: 50, tone: 'bg-warning' },
    { label: 'Good', pct: 75, tone: 'bg-teal' },
    { label: 'Strong', pct: 100, tone: 'bg-success' },
  ]
  return map[Math.min(score, 3)]
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const meter = strength(password)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
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
            Every concept, draft and review — in one calm workspace
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-umber">
            Start your organization&apos;s content memory today. Free for small teams.
          </p>
        </div>
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
          <h2 className="font-headline text-3xl font-semibold tracking-tight text-ink">Create your account</h2>
          <p className="mt-1.5 text-sm text-umber">Set up your workspace in under a minute.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="name" className="label">Full name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ananya Rao" className="input" />
            </div>
            <div>
              <label htmlFor="email" className="label">Work email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" className="input" />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input" />
              {password && (
                <div className="mt-2">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-ink/6">
                    <div className={`h-full rounded-full transition-all duration-300 ${meter.tone}`} style={{ width: `${meter.pct}%` }} />
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-umber/70">{meter.label}</p>
                </div>
              )}
            </div>
            <button type="submit" className="btn-primary w-full">Create account</button>
          </form>

          <p className="mt-6 text-center text-sm text-umber">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-teal hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
