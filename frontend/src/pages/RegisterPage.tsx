import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Lock, Mail, User as UserIcon } from 'lucide-react'

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
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-cream p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(15,118,110,0.10), transparent 60%), radial-gradient(ellipse 60% 50% at 90% 100%, rgba(15,118,110,0.08), transparent 55%)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{ backgroundImage: 'radial-gradient(rgba(28,25,23,0.14) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-3">
          <span className="brand-mark h-10 w-10 text-base">Aa</span>
          <span className="font-headline text-xl font-bold tracking-[-0.02em] text-ink">Aaryajanani</span>
        </div>

        <div className="relative z-10">
          <span className="auth-rule mb-5 block h-1 w-10" aria-hidden="true" />
          <h1 className="max-w-md font-headline text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
            Every concept, draft and review — in one calm workspace
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-umber">
            Start your organization&apos;s content memory today. Free for small teams.
          </p>
        </div>

        <p className="relative z-10 font-mono text-[10px] uppercase tracking-[0.2em] text-umber/60">
          Aaryajanani — Content Operations
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="brand-mark h-10 w-10 text-base">Aa</span>
          </div>

          <div className="stagger">
            <div>
              <h2 className="font-headline text-[32px] font-semibold leading-tight tracking-[-0.03em] text-ink">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-umber">Set up your workspace in under a minute.</p>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="name" className="label">Full name</label>
                <div className="relative">
                  <UserIcon size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-umber/50" />
                  <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ananya Rao" className="input !pl-10" />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="label">Work email</label>
                <div className="relative">
                  <Mail size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-umber/50" />
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" className="input !pl-10" />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <Lock size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-umber/50" />
                  <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input !pl-10" />
                </div>
                {password && (
                  <div className="mt-2.5">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-ink/6">
                      <div className={`h-full rounded-full transition-all duration-300 ${meter.tone}`} style={{ width: `${meter.pct}%` }} />
                    </div>
                    <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-umber/70">{meter.label}</p>
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary group w-full !h-11 !text-[15px]">
                Create account
                <ArrowRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-umber">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-teal transition-opacity hover:opacity-80">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
