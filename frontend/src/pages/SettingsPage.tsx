import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { useViewer } from '../lib/viewer'
import { ROLES, PERMISSION_LABELS } from '../lib/roles'
import { useToast } from '../components/toast'
import { useTeam } from '../lib/data'

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-teal' : 'bg-ink/15'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[left] ${on ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  )
}

function Row({
  title,
  desc,
  children,
}: {
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-[13px] text-umber">{desc}</p>
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const viewer = useViewer()
  const toast = useToast()
  const { org } = useTeam()
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifDigest, setNotifDigest] = useState(true)
  const [mentions, setMentions] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)
  const [orgName, setOrgName] = useState(org?.name ?? '')

  useEffect(() => { if (org) setOrgName(org.name) }, [org])

  const save = () => {
    // Persist preferences locally - backend settings API replaces this later
    try {
      localStorage.setItem(
        'folio.settings',
        JSON.stringify({ orgName: orgName.trim(), notifEmail, notifDigest, mentions, twoFactor }),
      )
    } catch {
      /* storage unavailable */
    }
    toast('success', 'Settings saved', 'Your preferences are up to date.')
  }

  return (
    <div className="fade-in mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-umber">Manage your workspace and notifications</p>
      </header>

      <div className="space-y-6">
        {/* Organization */}
        <section className="card p-6">
          <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Organization</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="label">Organization name</label>
              <input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Workspace slug</label>
              <input value={org?.slug ?? ''} readOnly className="input bg-canvas/60 font-mono text-umber" />
            </div>
          </div>
        </section>

        {/* Roles & permissions */}
        <section className="card overflow-hidden">
          <header className="border-b border-line px-6 py-4">
            <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Roles & permissions</h2>
            <p className="mt-0.5 text-[13px] text-umber">
              What each role can do in this workspace - this mirrors the permissions the backend enforces.
            </p>
          </header>
          <div className="divide-y divide-line">
            {ROLES.map((r) => (
              <div key={r.role} className={`px-6 py-5 transition-colors ${r.role === viewer.role ? 'bg-tint/40' : 'hover:bg-canvas/40'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-headline text-sm font-semibold tracking-[-0.01em] text-ink">{r.label}</span>
                    {r.role === viewer.role && (
                      <span className="rounded-full bg-teal/10 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-teal">
                        You
                      </span>
                    )}
                  </div>
                  <p className="max-w-md text-[13px] text-umber">{r.blurb}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.permissions.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-umber"
                    >
                      <Check size={10} strokeWidth={2.5} className="text-teal" />
                      {PERMISSION_LABELS[p]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="card p-6">
          <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Notifications</h2>
          <div className="mt-2 divide-y divide-line">
            <Row title="Email notifications" desc="Receive important updates by email">
              <Toggle on={notifEmail} onChange={setNotifEmail} />
            </Row>
            <Row title="Weekly digest" desc="A summary of the week every Monday">
              <Toggle on={notifDigest} onChange={setNotifDigest} />
            </Row>
            <Row title="Mentions" desc="Get notified when someone mentions you">
              <Toggle on={mentions} onChange={setMentions} />
            </Row>
          </div>
        </section>

        {/* Security */}
        <section className="card p-6">
          <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Security</h2>
          <div className="mt-2 divide-y divide-line">
            <Row title="Two-factor authentication" desc="Add an extra layer of security to your account">
              <Toggle on={twoFactor} onChange={setTwoFactor} />
            </Row>
          </div>
        </section>

        <button onClick={save} className="btn-primary">Save changes</button>
      </div>
    </div>
  )
}
