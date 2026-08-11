import Avatar from '../components/ui'
import { org } from '../lib/mockData'
import { useViewer } from '../lib/viewer'

export default function ProfilePage() {
  const viewer = useViewer()
  return (
    <div className="fade-in mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-ink">Profile</h1>
        <p className="mt-1 text-sm text-umber">Your account details</p>
      </header>

      <section className="card overflow-hidden p-0">
        <div className="h-24 bg-cream" />
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <Avatar initials={viewer.initials} size="xl" tone="ink" className="ring-4 ring-surface" />
            <button className="btn-secondary">Edit profile</button>
          </div>
          <h2 className="font-headline text-xl font-semibold tracking-tight text-ink">{viewer.name}</h2>
          <p className="text-sm text-umber">{viewer.title} · {org.name}</p>
        </div>
      </section>

      <section className="card mt-6 p-6">
        <h3 className="mb-4 font-headline text-base font-semibold tracking-tight text-ink">Account details</h3>
        <dl className="space-y-3">
          {[
            { k: 'Email', v: viewer.email },
            { k: 'Role', v: viewer.role },
            { k: 'Organization', v: org.name },
            { k: 'Workspace', v: org.slug },
          ].map((d) => (
            <div key={d.k} className="flex items-center justify-between">
              <dt className="text-[10px] font-mono uppercase tracking-wider text-umber/60">{d.k}</dt>
              <dd className="text-sm font-medium text-ink">{d.v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
