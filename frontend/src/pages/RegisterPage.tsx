import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Building2, Check, ChevronDown, Hash,
  Lock, Mail, Plus, Trash2, User as UserIcon, UserPlus, Eye, EyeOff,
} from 'lucide-react'
import { useToast } from '../components/toast'
import { login as apiLogin, register as apiRegister, createOrg as apiCreateOrg, addMember as apiAddMember } from '../services/api'

/* ------------------------------------------------------------------ */
/* Organization signup - three steps: Organization → Admin → Team     */
/* Mirrors the backend flow: register admin, create org, add members. */
/* ------------------------------------------------------------------ */

type Member = { id: number; name: string; email: string; role: string }

const ROLE_OPTIONS = [
  { value: 'editor', label: 'Editor' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'designer', label: 'Designer' },
  { value: 'publisher', label: 'Publisher' },
  { value: 'member', label: 'Member' },
]

const STEPS = [
  { label: 'Organization' },
  { label: 'Admin' },
  { label: 'Team' },
]

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  // 1..3 are wizard steps, 4 = done
  const [step, setStep] = useState(1)
  const [tried, setTried] = useState(false)

  // Step 1 - organization
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  // Step 2 - admin account
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Step 3 - team members (optional)
  const [members, setMembers] = useState<Member[]>([])

  const meter = strength(adminPassword)
  const slugOk = orgSlug.length > 0 && /^[a-z0-9-]+$/.test(orgSlug)

  const orgValid = orgName.trim().length > 0 && slugOk
  const passwordsMatch = confirmPassword.length > 0 && adminPassword === confirmPassword
  const adminValid =
    adminName.trim().length > 0 && EMAIL_RE.test(adminEmail) && adminPassword.length >= 8 && passwordsMatch

  const onOrgName = (v: string) => {
    setOrgName(v)
    if (!slugTouched) setOrgSlug(slugify(v))
  }

  const next = () => {
    setTried(true)
    if (step === 1 && !orgValid) return
    if (step === 2 && !adminValid) return
    setTried(false)
    setStep((s) => Math.min(s + 1, 4))
  }

  const back = () => {
    setTried(false)
    setStep((s) => Math.max(s - 1, 1))
  }

  const addMember = () =>
    setMembers((m) => [...m, { id: Date.now(), name: '', email: '', role: 'editor' }])
  const removeMember = (id: number) => setMembers((m) => m.filter((x) => x.id !== id))
  const patchMember = (id: number, patch: Partial<Member>) =>
    setMembers((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const invitedCount = members.filter((m) => m.email.trim().length > 0).length
  const toast = useToast()

  /** When the email is already registered: explain clearly and route to sign-in. */
  const [existingAccount, setExistingAccount] = useState<string | null>(null)

  const createWorkspace = async () => {
    setExistingAccount(null)
    try {
      // 1. Register the admin user, then sign in
      try {
        await apiRegister(adminName.trim(), adminEmail.trim(), adminPassword)
      } catch (err: any) {
        const msg = String(err?.message || '')
        if (/exist/i.test(msg)) {
          // Account already registered - tell the user plainly and send them to sign-in.
          setExistingAccount(adminEmail.trim())
          return
        }
        throw err
      }
      await apiLogin(adminEmail.trim(), adminPassword)
      // 2. Create the organization
      const org = await apiCreateOrg(orgName.trim(), orgSlug)
      // 3. Invite team members (best-effort)
      for (const m of members.filter((m) => m.email.trim().length > 0)) {
        try {
          await apiAddMember(org.id, m.email.trim(), m.role)
        } catch {
          /* ignore individual invite failures */
        }
      }
      toast('success', 'Workspace created', `${orgName.trim()} is ready.`)
      navigate('/', { replace: true })
    } catch {
      toast('danger', 'Could not create workspace', 'Check your details and try again.')
    }
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
          <span className="brand-mark h-10 w-10 text-base">Fo</span>
          <span className="font-headline text-xl font-bold tracking-[-0.02em] text-ink">Folio</span>
        </div>

        <div className="relative z-10">
          <span className="auth-rule mb-5 block h-1 w-10" aria-hidden="true" />
          <h1 className="max-w-md font-headline text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
            One calm home for your team&apos;s concepts, reviews and published work
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-umber">
            Set up your organization, add your team, and keep every decision in one calm workspace.
          </p>

          {/* Live preview of the workspace being created */}
          <div className="card card-hover mt-10 max-w-sm p-4">
            <div className="flex items-center gap-3">
              <span className="brand-mark h-9 w-9 text-xs">
                {orgName.trim() ? orgName.trim().slice(0, 2).toUpperCase() : 'Fo'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">
                  {orgName.trim() || 'Your organization'}
                </p>
                <p className="font-mono text-[11px] text-umber">
                  folio.app/{orgSlug || 'your-workspace'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-umber/70">Being set up</span>
              <span className="font-mono text-[10px] text-teal">
                {step === 4 ? 'Ready' : `Step ${Math.min(step, 3)} of 3`}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <span className="brand-mark h-10 w-10 text-base">Fo</span>
          </div>

          {/* Stepper */}
          <ol className="flex items-center gap-3" aria-label="Sign up progress">
            {STEPS.map((s, i) => {
              const n = i + 1
              const done = step > n
              const current = step === n
              return (
                <li key={s.label} className="flex flex-1 items-center gap-3 last:flex-none">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                      done
                        ? 'border-teal bg-teal text-white'
                        : current
                          ? 'border-teal bg-tint text-teal-press'
                          : 'border-line bg-surface text-umber/50'
                    }`}
                    aria-current={current ? 'step' : undefined}
                  >
                    {done ? <Check size={13} strokeWidth={2.5} /> : n}
                  </span>
                  <span
                    className={`hidden text-[13px] font-medium sm:block ${
                      current ? 'text-ink' : done ? 'text-ink/70' : 'text-umber/60'
                    }`}
                  >
                    {s.label}
                  </span>
                  {n < STEPS.length && (
                    <span className={`h-px flex-1 ${done ? 'bg-teal/25' : 'bg-ink/10'}`} aria-hidden="true" />
                  )}
                </li>
              )
            })}
          </ol>

          <div key={step} className="rise-in mt-9">
            {step === 1 && (
              <div>
                <h2 className="font-headline text-[28px] font-semibold leading-tight tracking-[-0.03em] text-ink">
                  Name your organization
                </h2>
                <p className="mt-2 text-sm text-umber">Your team, projects and content history will live here.</p>

                <form
                  onSubmit={(e) => { e.preventDefault(); next() }}
                  className="mt-7 space-y-5"
                  noValidate
                >
                  <div>
                    <label htmlFor="orgName" className="label">Organization name</label>
                    <div className="relative">
                      <Building2 size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-umber/50" />
                      <input
                        id="orgName"
                        value={orgName}
                        onChange={(e) => onOrgName(e.target.value)}
                        placeholder="Aaryajanani Studio"
                        className={`input !pl-10 ${tried && !orgName.trim() ? 'input-error' : ''}`}
                      />
                    </div>
                    {tried && !orgName.trim() && (
                      <p className="mt-1.5 font-mono text-[11px] text-danger" role="alert">Name your organization</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="orgSlug" className="label">Workspace URL</label>
                    <div className="relative">
                      <Hash size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-umber/50" />
                      <input
                        id="orgSlug"
                        value={orgSlug}
                        onChange={(e) => { setSlugTouched(true); setOrgSlug(slugify(e.target.value)) }}
                        placeholder="aaryajanani-studio"
                        className={`input !pl-10 font-mono text-[13px] ${tried && !slugOk ? 'input-error' : ''}`}
                      />
                    </div>
                    <p className="mt-1.5 font-mono text-[11px] text-umber/70">folio.app/{orgSlug || 'your-workspace'}</p>
                    {tried && !slugOk && (
                      <p className="mt-1.5 font-mono text-[11px] text-danger" role="alert">Use lowercase letters, numbers and dashes</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button type="button" onClick={next} className="btn-primary group flex-1 btn-lg">
                      Continue
                      <ArrowRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-headline text-[28px] font-semibold leading-tight tracking-[-0.03em] text-ink">
                  Create the admin account
                </h2>
                <p className="mt-2 text-sm text-umber">You&apos;ll own the workspace and manage your team.</p>

                {existingAccount && (
                  <div
                    className="mt-5 rounded-[10px] border border-warning/30 bg-warning/8 px-4 py-3"
                    role="alert"
                  >
                    <p className="text-sm font-medium text-ink">
                      An account with this email already exists
                    </p>
                    <p className="mt-0.5 text-[13px] text-umber">
                      <span className="font-medium text-ink">{existingAccount}</span> is already
                      registered. Sign in with it to finish setting up your workspace.
                    </p>
                    <Link to="/login" className="btn-secondary mt-3 !h-9 w-full text-[13px]">
                      Sign in instead
                    </Link>
                  </div>
                )}

                <form
                  onSubmit={(e) => { e.preventDefault(); next() }}
                  className="mt-7 space-y-5"
                  noValidate
                >
                  <div>
                    <label htmlFor="adminName" className="label">Full name</label>
                    <div className="relative">
                      <UserIcon size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-umber/50" />
                      <input
                        id="adminName"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Ananya Rao"
                        className={`input !pl-10 ${tried && !adminName.trim() ? 'input-error' : ''}`}
                      />
                    </div>
                    {tried && !adminName.trim() && (
                      <p className="mt-1.5 font-mono text-[11px] text-danger" role="alert">Enter your full name</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="adminEmail" className="label">Work email</label>
                    <div className="relative">
                      <Mail size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-umber/50" />
                      <input
                        id="adminEmail"
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="you@studio.com"
                        className={`input !pl-10 ${tried && !EMAIL_RE.test(adminEmail) ? 'input-error' : ''}`}
                      />
                    </div>
                    {tried && !EMAIL_RE.test(adminEmail) && (
                      <p className="mt-1.5 font-mono text-[11px] text-danger" role="alert">Enter a valid work email</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="adminPassword" className="label">Password</label>
                    <div className="relative">
                      <Lock size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-umber/50" />
                      <input
                        id="adminPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className={`input !pl-10 !pr-10 ${tried && adminPassword.length < 8 ? 'input-error' : ''}`}
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
                    {adminPassword && (
                      <div className="mt-2.5">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-ink/6">
                          <div className={`h-full rounded-full transition-[width] duration-300 ${meter.tone}`} style={{ width: `${meter.pct}%` }} />
                        </div>
                        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-umber/70">{meter.label}</p>
                      </div>
                    )}
                    {tried && adminPassword.length < 8 && (
                      <p className="mt-1.5 font-mono text-[11px] text-danger" role="alert">Use at least 8 characters</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="label">Confirm password</label>
                    <div className="relative">
                      <Lock size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-umber/50" />
                      <input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className={`input !pl-10 ${confirmPassword.length > 0 && !passwordsMatch ? 'input-error' : tried && !passwordsMatch ? 'input-error' : ''}`}
                      />
                    </div>
                    {confirmPassword.length > 0 && !passwordsMatch && (
                      <p className="mt-1.5 font-mono text-[11px] text-danger" role="alert">Passwords don&apos;t match yet</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button type="button" onClick={back} className="btn-secondary btn-lg">
                      <ArrowLeft size={15} strokeWidth={2} />
                      Back
                    </button>
                    <button type="submit" className="btn-primary group flex-1 btn-lg">
                      Continue
                      <ArrowRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-headline text-[28px] font-semibold leading-tight tracking-[-0.03em] text-ink">
                  Invite your team
                </h2>
                <p className="mt-2 text-sm text-umber">Add your editors, reviewers and publishers, or skip for now.</p>

                <div className="mt-7 space-y-3">
                  {members.length === 0 && (
                    <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-8 text-center">
                      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-tint text-teal">
                        <UserPlus size={17} strokeWidth={1.75} />
                      </span>
                      <p className="text-sm font-medium text-ink">No members yet</p>
                      <p className="mt-1 text-xs text-umber">You can invite them anytime from Settings.</p>
                    </div>
                  )}

                  {members.map((m) => (
                    <div key={m.id} className="card p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-0 flex-1 basis-40">
                          <UserIcon size={14} strokeWidth={1.75} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-umber/50" />
                          <input
                            value={m.name}
                            onChange={(e) => patchMember(m.id, { name: e.target.value })}
                            placeholder="Name"
                            className="input !h-9 !pl-8 text-[13px]"
                            aria-label="Member name"
                          />
                        </div>
                        <div className="relative min-w-0 flex-1 basis-48">
                          <Mail size={14} strokeWidth={1.75} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-umber/50" />
                          <input
                            type="email"
                            value={m.email}
                            onChange={(e) => patchMember(m.id, { email: e.target.value })}
                            placeholder="name@studio.com"
                            className="input !h-9 !pl-8 text-[13px]"
                            aria-label="Member email"
                          />
                        </div>
                        <div className="relative basis-32">
                          <select
                            value={m.role}
                            onChange={(e) => patchMember(m.id, { role: e.target.value })}
                            className="input !h-9 !pr-8 appearance-none text-[13px]"
                            aria-label="Member role"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} strokeWidth={1.75} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-umber/50" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMember(m.id)}
                          className="icon-btn icon-btn-sm shrink-0"
                          aria-label="Remove member"
                        >
                          <Trash2 size={14} strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button type="button" onClick={addMember} className="btn-secondary w-full">
                    <Plus size={15} strokeWidth={2} />
                    Add member
                  </button>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button type="button" onClick={back} className="btn-secondary btn-lg">
                    <ArrowLeft size={15} strokeWidth={2} />
                    Back
                  </button>
                  <button type="button" onClick={createWorkspace} className="btn-primary group flex-1 btn-lg">
                    Create workspace
                    <ArrowRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="mt-4 w-full text-center text-sm text-umber transition-colors hover:text-teal"
                >
                  Skip for now
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="text-center">
                <span className="brand-mark mx-auto flex h-14 w-14 items-center justify-center text-lg">
                  <Check size={24} strokeWidth={2.5} />
                </span>
                <h2 className="mt-6 font-headline text-[28px] font-semibold tracking-[-0.03em] text-ink">
                  Your workspace is ready
                </h2>
                <p className="mt-2 text-sm text-umber">
                  {orgName.trim()} is set up{adminName.trim() ? `, and ${adminName.trim().split(' ')[0]} is its admin` : ''}.
                </p>

                <div className="card mt-8 divide-y divide-line text-left">
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">Organization</span>
                    <span className="truncate pl-4 text-sm font-medium text-ink">{orgName.trim()}</span>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">Workspace</span>
                    <span className="font-mono text-[13px] text-ink">folio.app/{orgSlug}</span>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">Admin</span>
                    <span className="truncate pl-4 text-sm text-ink">{adminEmail}</span>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">Teammates</span>
                    <span className="text-sm text-ink">{invitedCount} invited</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/', { replace: true })}
                  className="btn-primary group mt-8 w-full btn-lg"
                >
                  Go to your workspace
                  <ArrowRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            )}
          </div>

          {step < 4 && (
            <p className="mt-8 text-center text-sm text-umber">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-teal transition-opacity hover:opacity-80">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
