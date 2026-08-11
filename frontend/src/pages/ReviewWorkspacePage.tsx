import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Chip, { statusTone, Modal } from '../components/primitives'
import Avatar from '../components/ui'
import { projects, videoReviews, team, SAMPLE_VIDEO_URL } from '../lib/mockData'
import { statusLabel, formatTime } from '../lib/format'
import { useViewer, can } from '../lib/viewer'

const memberOf = (id: string) => team.find((m) => m.id === id)

interface LocalComment {
  id: string
  author: string
  time: number
  body: string
  replies: { id: string; author: string; body: string }[]
  resolved: boolean
  createdAt: string
}

export default function ReviewWorkspacePage() {
  const { id } = useParams()
  const viewer = useViewer()
  const project = projects.find((p) => p.id === id)
  const review = id ? videoReviews[id] : undefined

  const videoRef = useRef<HTMLVideoElement>(null)
  const [versionId, setVersionId] = useState(review?.versions[0]?.id ?? '')
  const [currentTime, setCurrentTime] = useState(0)
  const [comments, setComments] = useState<LocalComment[]>(review?.comments ?? [])
  const [draft, setDraft] = useState('')
  const [draftTime, setDraftTime] = useState<number | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [revisionReason, setRevisionReason] = useState('')
  const [approved, setApproved] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (review) {
      setVersionId(review.versions[0].id)
      setComments(review.comments)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!project || !review) {
    return (
      <div className="fade-in card p-12 text-center">
        <h1 className="font-headline text-lg font-semibold text-ink">No review workspace for this project yet</h1>
        <p className="mt-1 text-sm text-umber">Drafts appear here once an editor uploads a video.</p>
        <Link to={`/projects/${id}`} className="btn-secondary mt-5 inline-flex">Back to project</Link>
      </div>
    )
  }

  const version = review.versions.find((v) => v.id === versionId) ?? review.versions[0]
  const openComments = comments.filter((c) => !c.resolved)
  const canComment = can(viewer, 'comment')
  const canApprove = can(viewer, 'approve')

  const seekTo = (t: number) => {
    const v = videoRef.current
    if (v) {
      v.currentTime = t
      void v.play()
      setCurrentTime(t)
    }
  }

  const captureTime = () => {
    const v = videoRef.current
    const t = v ? Math.floor(v.currentTime) : 0
    setDraftTime(t)
    setNotice(`Commenting at ${formatTime(t)}`)
  }

  const submitComment = () => {
    if (!draft.trim() || !canComment) return
    const t = draftTime ?? Math.floor(currentTime)
    setComments((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, author: viewer.id, time: t, body: draft.trim(), replies: [], resolved: false, createdAt: 'Just now' },
    ])
    setDraft('')
    setDraftTime(null)
    setNotice(null)
  }

  const submitReply = (parentId: string) => {
    if (!replyText.trim() || !canComment) return
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId
          ? { ...c, replies: [...c.replies, { id: `r-${Date.now()}`, author: viewer.id, body: replyText.trim() }] }
          : c,
      ),
    )
    setReplyText('')
    setReplyingTo(null)
  }

  const toggleResolve = (commentId: string) => {
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, resolved: !c.resolved } : c)))
  }

  const requestRevision = () => {
    setRevisionOpen(false)
    setNotice(`Revision requested — “${revisionReason.trim() || 'No reason given'}”. Notifying the editor.`)
    setRevisionReason('')
  }

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-umber/60">
            <Link to="/projects" className="hover:text-teal">Projects</Link>
            <span>/</span>
            <Link to={`/projects/${project.id}`} className="hover:text-teal">{project.title}</Link>
            <span>/</span>
            <span className="text-ink">Review</span>
          </nav>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="font-headline text-2xl font-semibold tracking-tight text-ink">{project.title}</h1>
            <Chip label={statusLabel(project.status)} tone={statusTone(project.status)} dot />
            {approved && <Chip label="Approved" tone="teal" />}
          </div>
          <p className="mt-1 text-sm text-umber">
            {version.label} · uploaded by {memberOf(version.uploadedBy)?.name} · {version.uploadedAt}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn-secondary"
            onClick={() => can(viewer, 'upload') && setRevisionOpen(true)}
            disabled={!can(viewer, 'upload')}
            title={!can(viewer, 'upload') ? 'Only editors can request a revision' : undefined}
          >
            Request revision
          </button>
          <button
            className="btn-primary"
            onClick={() => canApprove && setApproved(true)}
            disabled={!canApprove}
            title={!canApprove ? 'Only reviewers can approve' : undefined}
          >
            Approve {version.label}
          </button>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div className="flex items-center justify-between rounded-[8px] border border-line bg-tint/60 px-4 py-2.5 text-sm text-ink">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-xs text-teal hover:underline">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Video player */}
        <div className="card p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Watch &amp; comment</h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-umber/60">Version</span>
              <select
                value={versionId}
                onChange={(e) => setVersionId(e.target.value)}
                className="input !h-8 w-auto !px-2 text-xs"
                aria-label="Select draft version"
              >
                {review.versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label} — {v.summary}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-[8px] bg-ink">
            <video
              key={version.id}
              ref={videoRef}
              src={version.url || SAMPLE_VIDEO_URL}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full bg-black"
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs text-umber/70">
              Playhead <span className="text-ink">{formatTime(currentTime)}</span> · {review.fileName}
            </p>
            <button className="btn-secondary !h-9" onClick={captureTime} disabled={!canComment}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
                <path d="M7 3.5v3.5M7 7 9.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Comment at {formatTime(currentTime)}
            </button>
          </div>

          {/* Composer */}
          <div className="mt-4 rounded-[8px] border border-line bg-canvas/60 p-4">
            {draftTime !== null && (
              <button
                onClick={() => seekTo(draftTime)}
                className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-tint px-2.5 py-1 font-mono text-[11px] font-medium text-teal hover:underline"
              >
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M7 3.5v3.5M7 7 9.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                {formatTime(draftTime)}
                <span onClick={(e) => { e.stopPropagation(); setDraftTime(null) }} className="ml-1 text-umber hover:text-ink">×</span>
              </button>
            )}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment()
              }}
              placeholder={canComment ? 'Leave feedback for the editor — use “Comment at time” to anchor it to the video…' : 'You don’t have comment permission in this demo.'}
              disabled={!canComment}
              rows={3}
              className="w-full resize-none bg-transparent text-sm text-ink outline-none placeholder:text-umber/70"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[11px] text-umber/60">⌘/Ctrl + Enter to send</p>
              <button className="btn-primary !h-9" onClick={submitComment} disabled={!draft.trim() || !canComment}>
                Send comment
              </button>
            </div>
          </div>
        </div>

        {/* Comments panel */}
        <div className="card flex max-h-[70vh] flex-col p-0">
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-headline text-base font-semibold tracking-tight text-ink">Comments</h2>
            <span className="font-mono text-[11px] text-umber/60">{openComments.length} open</span>
          </header>
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {comments.length ? (
              comments.map((c) => (
                <article key={c.id} className={`rounded-[8px] border p-4 ${c.resolved ? 'border-line bg-canvas/40 opacity-70' : 'border-line bg-surface'}`}>
                  <div className="flex items-start gap-3">
                    <Avatar initials={memberOf(c.author)?.initials ?? '?'} size="sm" tone="teal" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-ink">{memberOf(c.author)?.name}</p>
                        <button
                          onClick={() => seekTo(c.time)}
                          className="inline-flex items-center gap-1 rounded-full bg-tint px-2 py-0.5 font-mono text-[11px] font-medium text-teal hover:underline"
                          title="Jump the video to this timestamp"
                        >
                          <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
                            <path d="M7 3.5v3.5M7 7 9.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                          </svg>
                          {formatTime(c.time)}
                        </button>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-umber/60">{c.createdAt}</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink/85">{c.body}</p>

                      {c.replies.map((r) => (
                        <div key={r.id} className="mt-3 flex gap-2.5 border-l-2 border-line pl-3">
                          <Avatar initials={memberOf(r.author)?.initials ?? '?'} size="xs" tone="tint" />
                          <div>
                            <p className="text-xs font-medium text-ink">{memberOf(r.author)?.name}</p>
                            <p className="text-sm leading-relaxed text-ink/80">{r.body}</p>
                          </div>
                        </div>
                      ))}

                      <div className="mt-3 flex items-center gap-3">
                        {canComment && (
                          <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} className="text-xs font-medium text-teal hover:underline">
                            {replyingTo === c.id ? 'Cancel' : 'Reply'}
                          </button>
                        )}
                        <button onClick={() => toggleResolve(c.id)} className="text-xs font-medium text-umber hover:text-ink">
                          {c.resolved ? 'Reopen' : 'Resolve'}
                        </button>
                      </div>

                      {replyingTo === c.id && canComment && (
                        <div className="mt-3 flex gap-2">
                          <input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') submitReply(c.id) }}
                            placeholder="Reply…"
                            className="input !h-9 flex-1"
                            autoFocus
                          />
                          <button className="btn-primary !h-9" onClick={() => submitReply(c.id)} disabled={!replyText.trim()}>
                            Send
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="py-10 text-center text-sm text-umber">No comments yet. Watch the video and leave feedback at any moment.</p>
            )}
          </div>
        </div>
      </div>

      {/* Revision modal */}
      <Modal open={revisionOpen} onClose={() => setRevisionOpen(false)} title="Request a revision">
        <p className="text-sm text-umber">Tell the editor what needs to change. Open comments on this draft stay attached to the revision.</p>
        <textarea
          value={revisionReason}
          onChange={(e) => setRevisionReason(e.target.value)}
          rows={4}
          placeholder="e.g. Rework the intro hook, fix the audio dip at 0:11, and delay the subtitle to 0:08…"
          className="input mt-4 w-full"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setRevisionOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={requestRevision} disabled={!revisionReason.trim()}>
            Send revision request
          </button>
        </div>
      </Modal>
    </div>
  )
}
