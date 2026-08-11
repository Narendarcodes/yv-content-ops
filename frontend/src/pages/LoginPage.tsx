import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { projects, team } from '../lib/mockData'
import { loginAs } from '../lib/auth'
import { useToast } from '../components/toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  // A live project card for the brand panel — proof the product works
  const sample = projects.find((p) => ['FIRST_DRAFT_SUBMITTED', 'UNDER_REVIEW'].includes(p.status)) ?? projects[0]

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const signIn = (memberId: string, label: string) => {
    setBusy(true)
    // Brief simulated latency so the flow feels real; backend replaces this later
    window.setTimeout(() => {
      loginAs(memberId)
      toast('success', `Signed in as ${label}`)
      navigate(from, { replace: true })
    }, 450)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(true)
      return
    }
    if (!password) {
      setError(true)
      return
    }
    setError(false)
    // Demo auth: a known team email signs in as that member, anything else
    // signs in as the workspace admin. Backend integration replaces this.
    const member = team.find((m) => m.email.toLowerCase() === email.trim().toLowerCase())
    signIn(member?.id ?? 'ananya', member?.name ?? 'Ananya Rao')
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-cream p-12 lg:flex">
        {/* Soft tonal field, not a gradient — keeps the surface quiet */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(15,118,110,0.10), transparent 60%), radial-gradient(ellipse 60% 50% at 90% 100%, rgba(15,118,110,0.08), transparent 55%)',
          }}
          aria-hidden="true"
        />
        {/* Fine dotted texture — quiet craft, not noise */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{ backgroundImage: 'radial-gradient(rgba(28,25,23,0.14) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-3">
          <span className="brand-mark h-10 w-10 text-base">Fo</span>
          <span className="font-headline text-xl font-bold tracking-[-0.02em] text-ink">Folio</span>
        </div>

        <div className="relative z-10">
          <span className="auth-rule mb-5 block h-1 w-10" aria-hidden="true" />
          <h1 className="max-w-md font-headline text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
            Precision content operations and project memory for modern editorial teams
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-umber">
            Concepts, drafts, reviews and published projects — every decision, remembered.
          </p>

          {/* Live project card — a quiet proof-of-life moment */}
          <div className="card card-hover mt-10 max-w-sm p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-tint text-teal">
                <Lock size={15} strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{sample.title}</p>
                <p className="text-[11px] text-umber">Last updated {sample.updated}</p>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-umber/70">In review</span>
              <span className="font-mono text-[10px] text-teal">2 comments</span>
            </div>
          </div>
        </div>

        <p className="relative z-10 font-mono text-[10px] uppercase tracking-[0.2em] text-umber/60">
          Folio — Content Operations
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="brand-mark h-10 w-10 text-base">Fo</span>
          </div>

          <div className="stagger">
            <div>
              <h2 className="font-headline text-[32px] font-semibold leading-tight tracking-[-0.03em] text-ink">
                Sign in to your workspace
              </h2>
              <p className="mt-2 text-sm text-umber">Welcome back. Pick up where you left off.</p>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="label">Work email</label>
                <div className="relative">
                  <Mail size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-umber/50" />
                  <input
                    id="email"
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
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="label !mb-0">Password</label>
                  <Link to="/forgot-password" className="text-xs font-medium text-teal transition-opacity hover:opacity-80">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-umber/50" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input !pl-10 !pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="icon-btn absolute right-1.5 top-1/2 !h-7 !w-7 -translate-y-1/2"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={busy} className="btn-primary group w-full !h-11 !text-[15px]">
                {busy ? 'Signing in…' : 'Sign in'}
                {!busy && <ArrowRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-umber">
              New to Folio?{' '}
              <Link to="/register" className="font-medium text-teal transition-opacity hover:opacity-80">
                Create your organization
              </Link>
            </p>

            <div className="mt-8 rounded-xl border border-dashed border-line bg-canvas/70 px-4 py-3 text-center">
              <p className="font-mono text-[10px] uppercase tracking-wider text-umber/70">Demo — no password needed</p>
              <p className="mt-0.5 text-xs text-umber">Any valid email signs you in. Your workspace is waiting.</p>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-wider text-umber/60">
                Or jump straight in as
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {team.map((m) => (
                  <button
                    key={m.id}
                    disabled={busy}
                    onClick={() => signIn(m.id, m.name)}
                    className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-teal/40 hover:bg-tint/40 disabled:opacity-50"
                  >
                    {m.name.split(' ')[0]} · {m.role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
