import { useState } from 'react'
import Chip, { statusTone, PageHeader, StatCard } from '../components/primitives'
import { invoices } from '../lib/mockData'

const summary = [
  { label: 'Outstanding', value: '₹2,45,000', tone: 'warning' as const, icon: <span className="text-sm font-mono">₹</span> },
  { label: 'Collected this month', value: '₹2,30,000', tone: 'success' as const, icon: <span className="text-sm font-mono">↑</span> },
  { label: 'Overdue', value: '₹2,25,000', tone: 'danger' as const, icon: <span className="text-sm font-mono">!</span> },
]

export default function InvoicesPage() {
  const [tab, setTab] = useState('All')
  const filtered = invoices.filter((i) => tab === 'All' || i.status === tab)

  return (
    <div className="fade-in">
      <PageHeader
        title="Invoices"
        subtitle="Billing across all active engagements"
        actions={
          <button className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Create invoice
          </button>
        }
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summary.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} tone={s.tone} />
        ))}
      </section>

      <div className="mb-5 flex rounded-[8px] border border-line bg-surface p-0.5 w-fit">
        {(['All', 'Pending', 'Paid', 'Overdue'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-[6px] px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              tab === t ? 'bg-ink text-on-accent' : 'text-umber hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="table-head">Invoice</th>
                <th className="table-head">Client</th>
                <th className="table-head">Amount</th>
                <th className="table-head">Due date</th>
                <th className="table-head">Status</th>
                <th className="table-head" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="table-row">
                  <td className="px-5 py-3.5 font-mono text-xs font-medium text-ink">{inv.id}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-ink">{inv.client}</td>
                  <td className="px-5 py-3.5 font-mono text-xs font-medium text-ink">{inv.amount}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-umber/80">{inv.due}</td>
                  <td className="px-5 py-3.5">
                    <Chip label={inv.status} tone={statusTone(inv.status)} dot />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="btn-ghost !h-8 !px-2.5 text-umber" aria-label={`View ${inv.id}`}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M4.5 2.5 9 7l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
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
