import { useState } from 'react'
import { org } from '../lib/mockData'

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-teal' : 'bg-ink/15'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${on ? 'left-[22px]' : 'left-0.5'}`}
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
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifDigest, setNotifDigest] = useState(true)
  const [mentions, setMentions] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)
  const [orgName, setOrgName] = useState(org.name)

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
              <input value={org.slug} readOnly className="input bg-canvas/60 font-mono text-umber" />
            </div>
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

        <button className="btn-primary">Save changes</button>
      </div>
    </div>
  )
}
