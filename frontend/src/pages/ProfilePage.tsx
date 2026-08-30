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
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src
  // Backend stores /uploads/<file> — resolve against API origin (http://localhost:3000)
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
  const fileRef = useRef<HTMLInputElement>(null)
  const access = roleOf(viewer)
  const { projects } = useProjects()
  const { team, org } = useTeam()
  const me = useMe()
  const { reviews } = useReviews()

  // Keep draft name in sync when viewer updates (after photo change)
  useEffect(() => {
    if (!editing) setName(viewer.name)
  }, [viewer.name, editing])

  // Preview for a locally selected file
  useEffect(() => {
    if (!pendingPhoto) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(pendingPhoto)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [pendingPhoto])

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

  const storedSrc = (viewer as any).photoUrl || (viewer as any).profileImage || null
  const avatarUrl = previewUrl ?? toAvatarUrl(storedSrc)

  const handlePickPhoto = () => fileRef.current?.click()

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setPhotoError('Only image files are allowed'); return }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Image must be under 5 MB'); return }
    setPhotoError(null)
    setPendingPhoto(file)
    // auto-enter edit mode so the user sees the preview and can Save/Cancel
    setEditing(true)
  }

  const handleSavePhoto = async () => {
    if (!pendingPhoto) return
    setPhotoUploading(true)
    setPhotoError(null)
    try {
      const updated = await uploadProfilePhoto(pendingPhoto)
      const nextUrl = (updated as any).photoUrl ?? (updated as any).profileImage ?? null
      updateSessionUser({ photoUrl: nextUrl, profileImage: nextUrl } as any)
      toast('success', 'Profile photo updated')
      setPendingPhoto(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: any) {
      setPhotoError(err?.message || 'Could not upload photo')
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!storedSrc && !pendingPhoto) return
    if (pendingPhoto) { setPendingPhoto(null); if (fileRef.current) fileRef.current.value = ''; return }
    setPhotoUploading(true)
    setPhotoError(null)
    try {
      await removeProfilePhoto()
      updateSessionUser({ photoUrl: null, profileImage: null } as any)
      toast('success', 'Profile photo removed')
    } catch (err: any) {
      setPhotoError(err?.message || 'Could not remove photo')
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setSaveError(null)
    setPhotoError(null)
    setPendingPhoto(null)
    setName(viewer.name)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSave = async () => {
    if (saving || photoUploading) return
    // If there's a pending photo, upload it first
    if (pendingPhoto) {
      await handleSavePhoto()
      // if photo upload failed, keep editing open so user sees the error
      if (photoError) return
    }
    if (name.trim() === viewer.name) {
      // only photo changed — close edit if photo succeeded
      if (pendingPhoto === null) setEditing(false)
      return
    }
    if (!name.trim()) { setSaveError('Name cannot be empty'); return }
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await updateMe({ name: name.trim() })
      updateSessionUser({ name: updated.name })
      toast('success', 'Profile updated', `You are now saved as ${updated.name}.`)
      setEditing(false)
      setPendingPhoto(null)
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (/token/i.test(msg)) {
        setSaveError('Your session expired. Please sign in again.')
        setTimeout(() => { window.location.href = '/login' }, 1500)
      } else {
        setSaveError(msg || 'Could not save. Try again.')
      }
    } finally {
      setSaving(false)
    }
  }

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

          {/* Hidden file input — only reachable via Edit */}
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim() && !saving && !photoUploading) {
                    e.currentTarget.blur()
                    const btn = document.getElementById('profile-save-btn')
                    btn?.click()
                  }
                }}
                className="input"
                placeholder="Your name"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-headline text-2xl font-semibold tracking-[-0.02em] text-ink">{viewer.name}</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-tint px-2.5 py-0.5 font-mono text-[11px] font-medium text-teal">
                  <Shield size={11} strokeWidth={2} />
                  {roleLabel[viewer.role] ?? viewer.role}
                </span>
              </div>
              {viewer.title && <p className="mt-1 text-sm text-umber">{viewer.title}</p>}
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
