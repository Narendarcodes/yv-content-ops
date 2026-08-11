import Chip, { statusTone, PageHeader } from '../components/primitives'
import Avatar from '../components/ui'
import { versions } from '../lib/mockData'

export default function VersionsPage() {
  return (
    <div className="fade-in">
      <PageHeader
        title="Versions"
        subtitle="Every draft, revision and approved state — nothing lost"
        actions={
          <button className="btn-secondary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 8a5.5 5.5 0 0 1 12 0M3.5 5.5 1 8l2.5 2.5M13 8l-2.5 2.5M8 8V3M8 3l1.8 1.8M8 3 6.2 4.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Compare versions
          </button>
        }
      />

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="table-head">Version</th>
                <th className="table-head">Document</th>
                <th className="table-head">Author</th>
                <th className="table-head">Updated</th>
                <th className="table-head">Status</th>
                <th className="table-head">Notes</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id} className="table-row">
                  <td className="px-5 py-4">
                    <span className={`rounded px-2 py-1 font-mono text-[11px] font-medium ${v.status === 'Current' ? 'bg-tint text-teal' : 'bg-ink/5 text-umber'}`}>
                      {v.tag}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-ink">Summer Sustainability Report</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar initials={v.initials} size="xs" tone="tint" />
                      <span className="text-sm text-ink/80">{v.author}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-umber/80">{v.date}</td>
                  <td className="px-5 py-4">
                    <Chip label={v.status} tone={statusTone(v.status)} dot />
                  </td>
                  <td className="px-5 py-4 text-sm text-umber">{v.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
