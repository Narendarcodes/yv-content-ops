import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import Chip, { Modal, PageHeader } from '../components/primitives'
import Avatar from '../components/ui'
import { useViewer, can } from '../lib/viewer'
import { primaryOrgId } from '../lib/data'
import {
  listConcepts,
  createConcept,
  approveConcept,
  declineConcept,
  type Concept,
} from '../services/api'

const TYPE_LABEL: Record<Concept['type'], string> = {
  'New Concept': 'New Concept',
  Experiment: 'Experiment',
  Revision: 'Revision',
}

export default function ConceptsPage() {
  const viewer = useViewer()
  const mayManage = can(viewer, 'manage_concepts')

  const [concepts, setConcepts] = useState<Concept[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  // propose modal
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<Concept['type']>('New Concept')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setLoadError(false)
    primaryOrgId()
      .then((orgId) => (orgId ? listConcepts(orgId) : []))
      .then((cs) => {
        setConcepts(cs)
        setLoading(false)
      })
      .catch(() => {
        setLoadError(true)
        setLoading(false)
      })
  }

  useEffect(load, [])

  const openIdeas = concepts.filter((c) => c.status === 'IDEA')
  const decided = concepts.filter((c) => c.status !== 'IDEA')

  const submit = async () => {
    if (!title.trim() || !description.trim() || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const orgId = await primaryOrgId()
      await createConcept(orgId!, {
        title: title.trim(),
        description: description.trim(),
        type,
      })
      setOpen(false)
      setTitle('')
      setDescription('')
      setType('New Concept')
      load() // refetch so the new concept shows immediately
    } catch (e) {
      setSubmitError('Could not save the concept. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const approve = async (id: string) => {
    setBusyId(id)
    try {
      const orgId = await primaryOrgId()
      await approveConcept(orgId!, id)
      load()
    } catch {
      setSubmitError('Approve failed — is the concept still open?')
    } finally {
      setBusyId(null)
    }
  }

  const decline = async (id: string) => {
    setBusyId(id)
    try {
      const orgId = await primaryOrgId()
      await declineConcept(orgId!, id)
      load()
    } catch {
      setSubmitError('Decline failed — is the concept still open?')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="fade-in space-y-8">
      <PageHeader
        title="Concepts"
        subtitle="Every content idea the team is weighing, before it becomes a project."
        actions={
          mayManage ? (
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <Plus size={14} strokeWidth={2} />
              Propose a concept
            </button>
          ) : undefined
        }
      />

      {loadError && (
        <div className="card flex items-center justify-between gap-4 border-danger/30 p-4">
          <p className="text-sm text-danger">Couldn't load concepts.</p>
          <button className="btn-secondary btn-sm" onClick={load}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="card h-24 animate-pulse bg-surface" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {openIdeas.map((c) => (
              <article key={c.id} className="card flex flex-wrap items-start gap-4 p-5">
                <Avatar initials={(c.proposerName ?? '?').slice(0, 2).toUpperCase()} size="md" tone="tint" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-headline text-[15px] font-semibold tracking-tight text-ink">{c.title}</h3>
                    <Chip label={TYPE_LABEL[c.type]} tone="neutral" />
                    <Chip label="Open for discussion" tone="warning" dot />
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/80">{c.description}</p>
                  {c.proposerName && (
                    <p className="mt-2 text-xs text-umber">Proposed by {c.proposerName}</p>
                  )}
                </div>

                {mayManage && (
                  <div className="flex items-center gap-2">
                    <button className="btn-secondary btn-sm" disabled={busyId === c.id} onClick={() => approve(c.id)}>
                      Approve &amp; start project
                    </button>
                    <button className="btn-ghost btn-sm text-danger" disabled={busyId === c.id} onClick={() => decline(c.id)}>
                      Decline
                    </button>
                  </div>
                )}
              </article>
            ))}

            {!openIdeas.length && !decided.length && (
              <div className="card p-12 text-center">
                <p className="text-sm text-umber">No concepts in the pipeline right now.</p>
              </div>
            )}
          </div>

          {decided.length > 0 && (
            <section>
              <h2 className="text-[11px] font-mono uppercase tracking-wider text-umber/60">Decided</h2>
              <div className="mt-3 space-y-2">
                {decided.map((c) => (
                  <div key={c.id} className="card flex flex-wrap items-center gap-3 p-4 opacity-80">
                    <span className={`inline-block h-2 w-2 rounded-full ${c.status === 'APPROVED' ? 'bg-success' : 'bg-danger/60'}`} />
                    <p className="min-w-0 flex-1 truncate text-sm text-ink">{c.title}</p>
                    {c.status === 'APPROVED' && c.approvedProjectId ? (
                      <Link to={`/projects/${c.approvedProjectId}`} className="text-xs font-medium text-teal hover:underline">
                        View project →
                      </Link>
                    ) : (
                      <Chip label="Declined" tone="danger" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Propose a concept */}
      <Modal open={open} onClose={() => setOpen(false)} title="Propose a concept">
        <label className="label" htmlFor="cn-title">Title</label>
        <input
          id="cn-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void submit()}
          placeholder="e.g. A short series on Puranic mothers"
          className="input mt-1.5 w-full"
        />

        <label className="label mt-4 block" htmlFor="cn-type">Type</label>
        <select id="cn-type" value={type} onChange={(e) => setType(e.target.value as Concept['type'])} className="input mt-1.5 w-full">
          <option value="New Concept">New Concept</option>
          <option value="Experiment">Experiment</option>
          <option value="Revision">Revision</option>
        </select>

        <label className="label mt-4 block" htmlFor="cn-desc">What is it?</label>
        <textarea
          id="cn-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe the idea, format and why it matters for our audience…"
          className="input mt-1.5 w-full"
        />

        {submitError && <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{submitError}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => void submit()} disabled={!title.trim() || !description.trim() || submitting}>
            {submitting ? 'Saving…' : 'Propose concept'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
