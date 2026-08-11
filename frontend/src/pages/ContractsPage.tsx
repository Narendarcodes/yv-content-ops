import Chip, { statusTone, PageHeader } from '../components/primitives'
import { contracts } from '../lib/mockData'

export default function ContractsPage() {
  return (
    <div className="fade-in">
      <PageHeader
        title="Contracts"
        subtitle="Engagements, retainers and scopes with every client"
        actions={
          <button className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            New contract
          </button>
        }
      />

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="table-head">Contract</th>
                <th className="table-head">Client</th>
                <th className="table-head">Type</th>
                <th className="table-head">Value</th>
                <th className="table-head">Term</th>
                <th className="table-head">Status</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} className="table-row">
                  <td className="px-5 py-3.5 font-mono text-xs font-medium text-ink">{c.id}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-ink">{c.client}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-umber/70">
                      {c.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs font-medium text-ink">{c.value}</td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-umber/80">
                    {c.start} — {c.end}
                  </td>
                  <td className="px-5 py-3.5">
                    <Chip label={c.status} tone={statusTone(c.status)} dot />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
