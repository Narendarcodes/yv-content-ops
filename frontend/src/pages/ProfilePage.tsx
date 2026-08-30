import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Check, Mail, Pencil, Shield, Star, Hash, X, AlertTriangle, Camera, Trash2 } from 'lucide-react'
import Avatar from '../components/ui'
import { useViewer } from '../lib/viewer'
import { roleOf, PERMISSION_LABELS } from '../lib/roles'
import { useToast } from '../components/toast'
import { updateSessionUser } from '../lib/auth'
import { API_BASE, updateMe, uploadProfilePhoto, removeProfilePhoto } from '../services/api'
import { useProjects, useTeam, useReviews, useMe } from '../lib/data'

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  editor: 'Editor',
  reviewer: 'Reviewer',
  publisher: 'Publisher',
  designer: 'Designer',
  member: 'Member',
}

function toAvatarUrl(src: string | null | undefined): string | null {
  if (!src) return null
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:')) return src
  const origin = API_BASE.replace(/\/api\/v1\/?$/, '')
  return `${origin}${src.startsWith('/') ? src : `/${src}`}`
}

export default function ProfilePage() {
  const viewer = useViewer()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(viewer.name)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [optimisticUrl, setOptimisticUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const access = roleOf(viewer)
  const { projects } = useProjects()
  const { team, org } = useTeam()
  const me = useMe()
  const { reviews } = useReviews()

  useEffect(() => { if (!editing) setName(viewer.name) }, [viewer.name, editing])

  // If the server photo arrives that matches our optimistic one, we can drop the optimistic cache
  const storedSrc = (viewer as any).photoUrl || (viewer as any).profileImage || null
  useEffect(() => {
    if (optimisticUrl && storedSrc) {
      const expected = optimisticUrl
      const actual = toAvatarUrl(storedSrc)
      if (expected === actual) setOptimisticUrl(null)
    }
  }, [storedSrc, optimisticUrl])

  const activeProjects = projects.filter(
    (p) => p.assignee === (me?.id ?? '') && !['PUBLISHED', 'CLOSED'].includes(p.status),
  ).length
  const myComments = reviews.filter((r) => r.author === me?.id).length
  const teammateCount = team.length

  const stats = [
    { label: 'Active projects', value: activeProjects },
    { label: 'Comments written', value: myComments },
    { label: 'Teammates', value: teammateCount },
  ]

  // Preview (blob) > optimistic server URL (right after Save, before viewer sync) > stored server URL
  const avatarSrc = previewUrl ?? optimisticUrl ?? storedSrc
  const avatarUrl = toAvatarUrl(avatarSrc)

  const handlePickPhoto = () => fileRef.current?.click()

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setPhotoError('Only image files are allowed'); if (fileRef.current) fileRef.current.value = ''; return }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Image must be under 5 MB'); if (fileRef.current) fileRef.current.value = ''; return }
    setPhotoError(null)
    setSaveError(null)
    // Create preview synchronously — no useEffect delay, fixes first-shot D bug
    const url = URL.createObjectURL(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(url)
    setPendingPhoto(file)
    setEditing(true)
    // keep input value so Clear works, but don't revoke yet
  }

  const handleClearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPendingPhoto(null)
    setPhotoError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSavePhoto = async (): Promise<boolean> => {
    if (!pendingPhoto) return true
    setPhotoUploading(true)
    setPhotoError(null)
    try {
      const updated = await uploadProfilePhoto(pendingPhoto)
      const nextUrl = (updated as any).photoUrl ?? (updated as any).profileImage ?? null
      const serverUrl = toAvatarUrl(nextUrl)
      setOptimisticUrl(serverUrl)
      updateSessionUser({ photoUrl: nextUrl, profileImage: nextUrl } as any)
      toast('success', 'Profile photo updated')
      // Keep preview until next render shows optimisticUrl, then clean up blob
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
      setPendingPhoto(null)
      if (fileRef.current) fileRef.current.value = ''
      return true
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (/invalid_token|invalid_refresh|expired/i.test(msg)) {
        setPhotoError('Session expired — please sign in again.')
        setTimeout(() => { window.location.href = '/login' }, 1200)
      } else {
        setPhotoError(msg || 'Could not upload photo')
      }
      return false
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    // pending selection exists — just clear it
    if (pendingPhoto) { handleClearSelection(); return }
    if (!storedSrc) return
    setPhotoUploading(true)
    setPhotoError(null)
    try {
      await removeProfilePhoto()
      setOptimisticUrl(null)
      updateSessionUser({ photoUrl: null, profileImage: null } as any)
      toast('success', 'Profile photo removed')
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (/invalid_token|invalid_refresh|expired/i.test(msg)) {
        setPhotoError('Session expired — please sign in again.')
      } else {
        setPhotoError(msg || 'Could not remove photo')
      }
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleCancel = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPendingPhoto(null)
    setOptimisticUrl(null)
    setEditing(false)
    setSaveError(null)
    setPhotoError(null)
    setName(viewer.name)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSave = async () => {
    if (saving || photoUploading) return
    setSaveError(null)
    // 1) photo first, if any
    if (pendingPhoto) {
      const ok = await handleSavePhoto()
      if (!ok) return // keep editing open to show photoError
      // handleSavePhoto already cleared preview/pending and set optimisticUrl
      // if name unchanged, we're done
      if (name.trim() === viewer.name.trim()) {
        setEditing(false)
        return
      }
    }
    // 2) name, if changed
    if (name.trim() !== viewer.name.trim()) {
      if (!name.trim()) { setSaveError('Name cannot be empty'); return }
      setSaving(true)
      try {
        const updated = await updateMe({ name: name.trim() })
        updateSessionUser({ name: updated.name })
        toast('success', 'Profile updated', `You are now saved as ${updated.name}.`)
        setEditing(false)
      } catch (err: any) {
        const msg = String(err?.message || '')
        if (/invalid_token|invalid_refresh|expired|token/i.test(msg)) {
          setSaveError('Your session expired. Please sign in again.')
          setTimeout(() => { window.location.href = '/login' }, 1200)
        } else {
          setSaveError(msg || 'Could not save. Try again.')
        }
        return
      } finally {
        setSaving(false)
      }
    } else if (!pendingPhoto) {
      // nothing changed
      setEditing(false)
    } else {
      setEditing(false)
    }
  }

  // Cleanup preview on unmount
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-7">
        <h1 className="font-headline text-[28px] font-semibold leading-tight tracking-[-0.03em] text-ink">
          Profile
        </h1>
        <p className="mt-1.5 text-sm text-umber">Your account details and workspace identity</p>
      </header>

      <section className="card overflow-hidden">
        <div className="relative h-28 overflow-hidden bg-cream">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(ellipse 70% 90% at 15% 0%, rgba(15,118,110,0.16), transparent 60%), radial-gradient(ellipse 60% 80% at 90% 100%, rgba(15,118,110,0.10), transparent 55%)',
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 opacity-40"
            style={{ backgroundImage: 'radial-gradient(rgba(28,25,23,0.12) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            aria-hidden="true"
          />
        </div>

        <div className="relative px-7 pb-7">
          <div className="-mt-11 mb-5 flex items-end justify-between">
            <span className="relative z-10 inline-flex">
              <Avatar
                initials={viewer.initials}
                size="xl"
                tone="ink"
                src={avatarUrl}
                className="h-24 w-24 text-[26px] ring-[5px] ring-surface shadow-[0_4px_16px_rgba(28,25,23,0.18)]"
              />
              {editing && (
                <button
                  onClick={handlePickPhoto}
                  disabled={photoUploading}
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-on-accent shadow-md ring-2 ring-surface transition-opacity hover:bg-ink/90 disabled:opacity-50"
                  aria-label="Change profile photo"
                  title="Change profile photo"
                >
                  <Camera size={12} strokeWidth={2} />
                </button>
              )}
            </span>
            {editing ? (
              <div className="flex items-center gap-2">
                <button onClick={handleCancel} className="btn-ghost">
                  <X size={14} strokeWidth={1.75} />
                  Cancel
                </button>
                <button
                  id="profile-save-btn"
                  disabled={saving || photoUploading || !name.trim()}
                  onClick={handleSave}
                  className="btn-primary"
                >
                  <Check size={14} strokeWidth={2} />
                  {saving || photoUploading ? 'Saving…' : 'Save'}
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-secondary group">
                <Pencil size={14} strokeWidth={1.75} className="text-umber transition-transform group-hover:-rotate-6" />
                Edit profile
              </button>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

          {editing && (
            <div className="mb-4 rounded-xl border border-line bg-canvas/60 p-3">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-umber/70">Profile photo</p>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={handlePickPhoto} disabled={photoUploading} className="btn-secondary text-xs">
                  <Camera size={13} /> {pendingPhoto ? 'Change selected' : storedSrc ? 'Change photo' : 'Add photo'}
                </button>
                {(storedSrc || pendingPhoto) && (
                  <button onClick={handleRemovePhoto} disabled={photoUploading} className="btn-ghost text-xs text-danger">
                    <Trash2 size={13} /> {pendingPhoto ? 'Clear selection' : 'Remove photo'}
                  </button>
                )}
                {pendingPhoto && (
                  <span className="text-xs text-umber">{pendingPhoto.name} · {(pendingPhoto.size / 1024).toFixed(0)} KB · will save with profile</span>
                )}
                {!pendingPhoto && storedSrc && (
                  <span className="text-xs text-umber/70">Current photo shown above — change or remove, then Save.</span>
                )}
              </div>
              <p className="mt-2 text-xs text-umber/70">JPG or PNG, max 5 MB. Saved when you click Save.</p>
            </div>
          )}

          {(photoError || saveError) && (
            <div className="mb-4 flex items-center gap-2 rounded-[10px] border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-sm text-danger" role="alert">
              <AlertTriangle size={15} strokeWidth={1.75} />
              {photoError || saveError}
            </div>
          )}

          {editing ? (
            <div className="mt-2">
              <label htmlFor="profile-name" className="label">Full name</label>
              <input
                id="profile-name"
                name="name"
                type="text"
                autoComplete="name"
                spellCheck={false}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim() && !saving && !photoUploading) {
                    e.currentTarget.blur()
                    const btn = document.getElementById('profile-save-btn')
                    btn?.click()
                  }
                }}
                className="input touch-manipulation focus-visible:ring-2 focus-visible:ring-teal/20"
                placeholder="Your name…"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-headline truncate text-2xl font-semibold tracking-[-0.02em] text-ink">{viewer.name}</h2>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-tint px-2.5 py-0.5 font-mono text-[11px] font-medium text-teal">
                  <Shield size={11} strokeWidth={2} aria-hidden="true" />
                  {roleLabel[viewer.role] ?? viewer.role}
                </span>
              </div>
              {viewer.title && <p className="mt-1 truncate text-sm text-umber">{viewer.title}</p>}
            </>
          )}

          <div className="mt-6 grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-line bg-canvas/70 px-4 py-3">
                <p className="font-headline text-2xl font-semibold tracking-[-0.02em] text-ink">{s.value}</p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-umber/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card mt-6 overflow-hidden">
        <header className="border-b border-line px-6 py-4">
          <h3 className="font-headline text-[15px] font-semibold tracking-[-0.01em] text-ink">Account details</h3>
        </header>
        <ul className="divide-y divide-line">
          {[
            { k: 'Email', v: viewer.email, icon: <Mail size={15} strokeWidth={1.75} /> },
            { k: 'Role', v: roleLabel[viewer.role] ?? viewer.role, icon: <Shield size={15} strokeWidth={1.75} /> },
            { k: 'Organization', v: org?.name ?? '-', icon: <Building2 size={15} strokeWidth={1.75} /> },
            { k: 'Workspace', v: org?.slug ?? '-', icon: <Hash size={15} strokeWidth={1.75} /> },
            { k: 'Member since', v: '2026', icon: <Star size={15} strokeWidth={1.75} /> },
          ].map((d) => (
            <li key={d.k} className="flex items-center gap-3.5 px-6 py-3.5 transition-colors hover:bg-canvas/50">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-umber">
                {d.icon}
              </span>
              <dt className="flex-1 font-mono text-[10px] uppercase tracking-wider text-umber/70">{d.k}</dt>
              <dd className="text-sm font-medium text-ink">{d.v}</dd>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-6 overflow-hidden">
        <header className="border-b border-line px-6 py-4">
          <h3 className="font-headline text-[15px] font-semibold tracking-[-0.01em] text-ink">Your access</h3>
        </header>
        <div className="px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">{access.label} role</p>
              <p className="mt-0.5 text-[13px] text-umber">{access.blurb}</p>
            </div>
            <Link to="/settings" className="group flex items-center gap-1 text-xs font-medium text-teal transition-opacity hover:opacity-80">
              View all roles
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {access.permissions.map((p) => (
              <li key={p} className="flex items-center gap-2.5 rounded-lg border border-line bg-canvas/60 px-3 py-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
                  <Check size={11} strokeWidth={2.5} />
                </span>
                <span className="text-[13px] font-medium text-ink">{PERMISSION_LABELS[p]}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
