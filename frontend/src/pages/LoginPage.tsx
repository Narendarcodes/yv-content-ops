import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useToast } from '../components/toast'
import { login as apiLogin } from '../services/api'
import BrandLogo from '../components/BrandLogo'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const signIn = async (emailAddr: string, passwordVal: string) => {
    setBusy(true)
    setFormError(null)
    try {
      await apiLogin(emailAddr, passwordVal)
      toast('success', 'Signed in')
      navigate(from, { replace: true })
    } catch {
      // Backend unreachable or credentials rejected - say which, inline.
      setFormError('We could not sign you in. Check your email and password, then try again.')
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    let ok = true
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid work email')
      ok = false
    } else {
      setEmailError(null)
    }
    if (!password) {
      setPasswordError('Enter your password')
      ok = false
    } else {
      setPasswordError(null)
    }
    if (!ok) return
    void signIn(email.trim(), password)
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-cream p-12 lg:flex">
        {/* Soft tonal field, not a gradient - keeps the surface quiet */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(15,118,110,0.10), transparent 60%), radial-gradient(ellipse 60% 50% at 90% 100%, rgba(15,118,110,0.08), transparent 55%)',
          }}
          aria-hidden="true"
        />
        {/* Fine dotted texture - quiet craft, not noise */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{ backgroundImage: 'radial-gradient(rgba(28,25,23,0.14) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-3">
          <BrandLogo to="/" size={40} />
        </div>

        <div className="relative z-10">
          <span className="auth-rule mb-5 block h-1 w-10" aria-hidden="true" />
          <h1 className="max-w-md font-headline text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
            Precision content operations and project memory for modern editorial teams
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-umber">
            Every concept, draft, review and published post in one place.
          </p>

          {/* Live project card - a quiet proof-of-life moment */}
          <div className="card card-hover mt-10 max-w-sm p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-tint text-teal">
                <Lock size={15} strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">Your work, in one workspace</p>
                <p className="text-[11px] text-umber">Concepts, reviews, approvals and publishing</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-umber/70">Secure sign-in</span>
              <span className="font-mono text-[10px] text-teal">Role-based access</span>
            </div>
          </div>
        </div>

      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <BrandLogo to="/" size={40} />
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
                    className={`input !pl-10 ${emailError ? 'input-error' : ''}`}
                  />
                </div>
                {emailError && (
                  <p className="mt-1.5 font-mono text-[11px] text-danger" role="alert">
                    {emailError}
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
                    className={`input !pl-10 !pr-10 ${passwordError ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="icon-btn icon-btn-sm absolute right-1.5 top-1/2 -translate-y-1/2"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                  </button>
                </div>
              </div>
              {passwordError && (
                <p className="mt-1.5 font-mono text-[11px] text-danger" role="alert">
                  {passwordError}
                </p>
              )}
              {formError && (
                <div
                  className="rounded-[10px] border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
                  role="alert"
                >
                  {formError}
                </div>
              )}
              <button type="submit" disabled={busy} className="btn-primary group w-full btn-lg">
                {busy ? 'Signing in…' : 'Sign in'}
                {!busy && <ArrowRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-umber">
              New to yv.?{' '}
              <Link to="/register" className="font-medium text-teal transition-opacity hover:opacity-80">
                Create your organization
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
