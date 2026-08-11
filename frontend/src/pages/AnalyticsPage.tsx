import { Link } from 'react-router-dom'
import Chip, { PageHeader } from '../components/primitives'
import { publishedPosts, projects } from '../lib/mockData'

const maxViews = Math.max(...publishedPosts.map((p) => parseFloat(p.views)))

function viewsToNumber(v: string): number {
  const n = parseFloat(v)
  return v.endsWith('K') ? n * 1000 : n
}

export default function AnalyticsPage() {
  return (
    <div className="fade-in space-y-8">
      <PageHeader
        title="Analytics"
        subtitle="How our published projects are performing. Metrics are entered manually for now — automated ingestion comes later."
      />

      {/* Bar chart */}
      <section className="card p-5">
        <h2 className="mb-5 font-headline text-base font-semibold tracking-tight text-ink">Views by published project</h2>
        <div className="flex h-56 items-end gap-6 px-2">
          {publishedPosts.map((p) => (
            <div key={p.projectId} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="font-mono text-xs font-medium text-ink">{p.views}</span>
              <div
                className="w-full max-w-16 rounded-t-[8px] bg-teal/80 transition-all hover:bg-teal"
                style={{ height: `${Math.max(8, (viewsToNumber(p.views) / viewsToNumber(maxViews.toFixed(1))) * 100)}%` }}
                title={p.title}
              />
              <span className="w-full truncate text-center text-[10px] text-umber/70">{p.platform}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Table */}
      <section className="card p-0">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Published projects</h2>
          <span className="font-mono text-[11px] text-umber/60">Manual metrics</span>
        </header>
        <div className="overflow-x-auto">
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
              {publishedPosts.map((p) => {
                const project = projects.find((x) => x.id === p.projectId)
                return (
                  <tr key={p.projectId} className="table-row">
                    <td className="px-5 py-3.5">
                      <Link to={`/projects/${p.projectId}`} className="font-medium text-ink hover:text-teal">{p.title}</Link>
                    </td>
                    <td className="px-5 py-3.5"><Chip label={p.platform} tone="neutral" /></td>
                    <td className="px-5 py-3.5 font-mono text-xs text-umber">{p.posted}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-ink">{p.views}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-ink">{p.likes}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-umber">{p.comments}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-umber">{p.shares}</td>
                    <td className="px-5 py-3.5 text-right">
                      {project?.postUrl && (
                        <a href={project.postUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-teal hover:underline">
                          View post
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <p className="rounded-[8px] border border-dashed border-line px-4 py-3 text-xs text-umber">
        Metrics are recorded manually against each published project (per PRD). A metrics adapter for automatic Instagram / YouTube
        ingestion is planned — until then this screen stays manual.
      </p>
    </div>
  )
}
