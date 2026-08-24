import { Link } from 'react-router-dom'
import Chip, { PageHeader } from '../components/primitives'
import { useAnalytics } from '../lib/data'

export default function AnalyticsPage() {
  const { rows } = useAnalytics()
  const maxViews = rows.reduce((m, r) => Math.max(m, r.views), 0)

  return (
    <div className="fade-in space-y-8">
      <PageHeader
        title="Analytics"
        subtitle="How published projects are performing. Metrics are entered manually for now; automated ingestion comes later."
      />

      {/* Bar chart */}
      <section className="card p-5">
        <h2 className="mb-5 font-headline text-base font-semibold tracking-tight text-ink">Views by published project</h2>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-umber">Metrics appear here once a project goes live.</p>
        ) : (
          <div className="flex h-56 items-end gap-6 px-2">
            {rows.map((p) => (
              <div key={p.projectId} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="font-mono text-xs font-medium text-ink">{p.views.toLocaleString()}</span>
                <div
                  className="w-full max-w-16 rounded-t-[8px] bg-teal/80 transition-colors hover:bg-teal"
                  style={{ height: `${maxViews ? Math.max(8, (p.views / maxViews) * 100) : 8}%` }}
                  title={p.title}
                />
                <span className="w-full truncate text-center text-[10px] text-umber/70">{p.platform}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Table */}
      <section className="card p-0">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Published projects</h2>
          <span className="font-mono text-[11px] text-umber/60">Manual metrics</span>
        </header>
        <div className="overflow-x-auto">
          {rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-umber">Metrics appear here once a project goes live.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="table-head">
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Platform</th>
                  <th className="px-5 py-3">Posted</th>
                  <th className="px-5 py-3 text-right">Views</th>
                  <th className="px-5 py-3 text-right">Likes</th>
                  <th className="px-5 py-3 text-right">Comments</th>
                  <th className="px-5 py-3 text-right">Shares</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((p) => (
                  <tr key={p.projectId} className="table-row">
                    <td className="px-5 py-3.5">
                      <Link to={`/projects/${p.projectId}`} className="font-medium text-ink hover:text-teal">{p.title}</Link>
                    </td>
                    <td className="px-5 py-3.5"><Chip label={p.platform} tone="neutral" /></td>
                    <td className="px-5 py-3.5 font-mono text-xs text-umber">{p.posted}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-ink">{p.views.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-ink">{p.likes.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-umber">{p.comments.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-umber">{p.shares.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      {p.postUrl && (
                        <a href={p.postUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-teal hover:underline">
                          View post
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <p className="rounded-[8px] border border-dashed border-line px-4 py-3 text-xs text-umber">
        Metrics are recorded manually against each published project (per PRD). A metrics adapter for automatic Instagram / YouTube
        ingestion is planned; until then this screen stays manual.
      </p>
    </div>
  )
}
