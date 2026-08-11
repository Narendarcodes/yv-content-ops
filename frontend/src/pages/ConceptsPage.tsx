import { useState } from 'react'
import { Link } from 'react-router-dom'
import Chip, { Modal, PageHeader } from '../components/primitives'
import Avatar from '../components/ui'
import { concepts as seedConcepts, team, type Concept } from '../lib/mockData'
import { useViewer, can } from '../lib/viewer'

const memberOf = (id: string) => team.find((m) => m.id === id)

export default function ConceptsPage() {
  const viewer = useViewer()
  const [concepts, setConcepts] = useState<Concept[]>(seedConcepts)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<Concept['type']>('New Concept')
  const [description, setDescription] = useState('')

  const mayManage = can(viewer, 'manage_concepts')

  const approve = (id: string) => {
    setConcepts((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'APPROVED_CONCEPT' } : c)))
  }

  const decline = (id: string) => {
    setConcepts((prev) => prev.filter((c) => c.id !== id))
  }

  const submit = () => {
    if (!title.trim() || !description.trim()) return
    setConcepts((prev) => [
      { id: `cn-${Date.now()}`, title: title.trim(), proposer: viewer.id, type, status: 'IDEA', submitted: 'Just now', description: description.trim(), discussion: 'Newly proposed — waiting for the team to discuss.' },
      ...prev,
    ])
    setTitle('')
    setDescription('')
    setType('New Concept')
    setOpen(false)
  }

  const openCount = concepts.filter((c) => c.status === 'IDEA').length

  return (
    <div className="fade-in space-y-8">
      <PageHeader
        title="Concepts"
        subtitle="Every content idea the team is weighing, before it becomes a project."
        actions={
          mayManage ? (
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Propose a concept
            </button>
          ) : undefined
        }
      />

      <div className="space-y-4">
        {concepts.map((c) => (
          <article key={c.id} className="card flex flex-wrap items-start gap-4 p-5">
            <Avatar initials={memberOf(c.proposer)?.initials ?? '?'} size="md" tone="tint" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-headline text-[15px] font-semibold tracking-tight text-ink">{c.title}</h3>
                <Chip label={c.type} tone="neutral" />
                <Chip label={c.status === 'APPROVED_CONCEPT' ? 'Approved — ready to assign' : 'Open for discussion'} tone={c.status === 'APPROVED_CONCEPT' ? 'teal' : 'warning'} dot />
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/80">{c.description}</p>
              <p className="mt-2 text-xs text-umber">
                Proposed by {memberOf(c.proposer)?.name} · {c.submitted}
              </p>
              <p className="mt-1 rounded-[8px] bg-canvas/70 px-3 py-2 text-xs text-umber">{c.discussion}</p>
            </div>

            {mayManage && (
              <div className="flex items-center gap-2">
                {c.status === 'IDEA' ? (
                  <>
                    <button className="btn-secondary !h-9" onClick={() => approve(c.id)}>Approve &amp; start project</button>
                    <button className="btn-ghost !h-9 text-danger" onClick={() => decline(c.id)}>Decline</button>
                  </>
                ) : (
                  <Link to="/projects" className="btn-primary !h-9">Create project</Link>
                )}
              </div>
            )}
          </article>
        ))}

        {!concepts.length && (
          <div className="card p-12 text-center">
            <p className="text-sm text-umber">No concepts in the pipeline right now.</p>
          </div>
        )}
      </div>

      {/* Propose a concept */}
      <Modal open={open} onClose={() => setOpen(false)} title="Propose a concept">
        <label className="label" htmlFor="cn-title">Title</label>
        <input id="cn-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. A short series on Puranic mothers" className="input mt-1.5 w-full" />

        <label className="label mt-4 block" htmlFor="cn-type">Type</label>
        <select id="cn-type" value={type} onChange={(e) => setType(e.target.value as Concept['type'])} className="input mt-1.5 w-full">
          <option value="New Concept">New Concept</option>
          <option value="Experiment">Experiment</option>
          <option value="Revision">Revision</option>
        </select>

        <label className="label mt-4 block" htmlFor="cn-desc">What is it?</label>
        <textarea id="cn-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the idea, format and why it matters for our audience…" className="input mt-1.5 w-full" />

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={!title.trim() || !description.trim()}>
            Propose concept
          </button>
        </div>
      </Modal>

      {openCount === 0 && <p className="text-center text-xs text-umber/60">All concepts approved — great momentum.</p>}
    </div>
  )
}
