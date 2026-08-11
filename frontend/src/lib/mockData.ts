/**
 * Mock data for Aaryajanani — Social Media Content Operations OS.
 * Domain language follows the PRD: Concepts, Projects, drafts, versions,
 * review (on video timestamps), revisions, approval, scheduling and
 * published projects. No agency/CRM vocabulary (no briefs, contracts,
 * invoices, "publications").
 */

export const org = {
  id: 'org_aarya',
  name: 'Aaryajanani Content Team',
  slug: 'aaryajanani',
}

/* ---------- Team & viewer (role simulation) ---------- */

export interface TeamMember {
  id: string
  name: string
  initials: string
  email: string
  role: 'admin' | 'editor' | 'reviewer' | 'designer' | 'publisher'
  title: string
  lastActive: string
}

export const team: TeamMember[] = [
  { id: 'ananya', name: 'Ananya Rao', initials: 'AR', email: 'ananya@aaryajanani.org', role: 'admin', title: 'Team Lead', lastActive: '2m ago' },
  { id: 'priya', name: 'Priya Menon', initials: 'PM', email: 'priya@aaryajanani.org', role: 'editor', title: 'Video Editor', lastActive: '18m ago' },
  { id: 'arjun', name: 'Arjun Nair', initials: 'AN', email: 'arjun@aaryajanani.org', role: 'editor', title: 'Editor', lastActive: '1h ago' },
  { id: 'sana', name: 'Sana Kapoor', initials: 'SK', email: 'sana@aaryajanani.org', role: 'reviewer', title: 'Content & Review', lastActive: '3h ago' },
  { id: 'rohan', name: 'Rohan Das', initials: 'RD', email: 'rohan@aaryajanani.org', role: 'designer', title: 'Designer', lastActive: '5h ago' },
  { id: 'meera', name: 'Meera Iyer', initials: 'MI', email: 'meera@aaryajanani.org', role: 'publisher', title: 'Scheduler & Publisher', lastActive: 'Yesterday' },
]

/** Display-list shape kept for the Members screen. */
export const members = team.map((m) => ({
  id: m.id,
  name: m.name,
  email: m.email,
  initials: m.initials,
  role: m.role.charAt(0).toUpperCase() + m.role.slice(1),
  lastActive: m.lastActive,
}))

/* ---------- Projects (PRD lifecycle statuses) ---------- */

export interface Project {
  id: string
  title: string
  type: 'New Concept' | 'Experiment' | 'Revision' | 'Content Production'
  status: string // PRD status enum, see statusLabel()
  description: string
  assignee: string // team member id
  creator: string
  reviewers: string[]
  updated: string
  scheduleDate?: string
  platform?: string
  postUrl?: string
  publishedAt?: string
  approvedVersion?: string
}

export const projects: Project[] = [
  {
    id: 'p1',
    title: 'Ashram Testimonial — Episode 1',
    type: 'Content Production',
    status: 'FIRST_DRAFT_SUBMITTED',
    description: 'First-person story of a mother from the ashram, filmed on location. Vertical cut for Instagram Reels and a 16:9 cut for YouTube.',
    assignee: 'priya',
    creator: 'ananya',
    reviewers: ['sana', 'ananya'],
    updated: '2h ago',
    approvedVersion: 'v1.2',
  },
  {
    id: 'p2',
    title: 'Pre-pregnancy Awareness Reel',
    type: 'Content Production',
    status: 'UNDER_REVIEW',
    description: 'A 45-second explainer reel on pre-pregnancy care, animated text over footage. Reviewer feedback in progress.',
    assignee: 'arjun',
    creator: 'sana',
    reviewers: ['sana'],
    updated: '4h ago',
  },
  {
    id: 'p3',
    title: 'Diwali Campaign — Light of Giving',
    type: 'Content Production',
    status: 'IN_PROGRESS',
    description: 'Festive campaign: one hero video + three static posts. Editor is assembling the hero cut now.',
    assignee: 'arjun',
    creator: 'ananya',
    reviewers: ['sana', 'rohan'],
    updated: '6h ago',
  },
  {
    id: 'p4',
    title: 'Post-natal Nutrition Carousel',
    type: 'Content Production',
    status: 'WAITING_FOR_INPUTS',
    description: 'Instagram carousel (8 slides) on post-natal nutrition. Waiting on food photography and the dietitian voice notes.',
    assignee: 'rohan',
    creator: 'sana',
    reviewers: ['ananya'],
    updated: '1d ago',
  },
  {
    id: 'p5',
    title: 'Yoga Series — Episode 4',
    type: 'Content Production',
    status: 'APPROVED',
    description: 'Fourth episode of the home-practice yoga series. v1.3 approved by Sana and Ananya.',
    assignee: 'priya',
    creator: 'ananya',
    reviewers: ['sana'],
    updated: '1d ago',
    approvedVersion: 'v1.3',
  },
  {
    id: 'p6',
    title: 'Festive Special — Puranic Story',
    type: 'Experiment',
    status: 'IDEA',
    description: 'Experiment: a narrated Puranic story as a long-form reel. Hypothesis — storytelling drives shares more than testimonials.',
    assignee: 'sana',
    creator: 'sana',
    reviewers: ['ananya'],
    updated: '2d ago',
  },
  {
    id: 'p7',
    title: 'Annual Impact Report 2026',
    type: 'Content Production',
    status: 'INPUTS_READY',
    description: 'Year-in-review video and carousel. All impact data and footage now received — editor can start.',
    assignee: 'arjun',
    creator: 'ananya',
    reviewers: ['sana', 'ananya'],
    updated: '3d ago',
  },
  {
    id: 'p8',
    title: "Kids' Story Corner — Pilot",
    type: 'Experiment',
    status: 'APPROVED_CONCEPT',
    description: 'Pilot of a weekly animated story segment for children. Concept agreed by the team — needs an assignee.',
    assignee: 'ananya',
    creator: 'ananya',
    reviewers: ['sana'],
    updated: '3d ago',
  },
  {
    id: 'p9',
    title: 'Ashram Tour — Behind the Scenes',
    type: 'Content Production',
    status: 'PUBLISHED',
    description: 'Behind-the-scenes tour of the ashram. Published on YouTube.',
    assignee: 'priya',
    creator: 'ananya',
    reviewers: ['sana'],
    updated: 'Sep 28',
    platform: 'YouTube',
    postUrl: 'https://youtube.com/watch?v=ashram-tour-bts',
    publishedAt: 'Sep 28, 2026',
  },
  {
    id: 'p10',
    title: "Mothers' Day Tribute Reel",
    type: 'Content Production',
    status: 'PUBLISHED',
    description: 'Tribute reel for Mothers’ Day featuring five ashram mothers. Published on Instagram.',
    assignee: 'priya',
    creator: 'sana',
    reviewers: ['ananya'],
    updated: 'May 10',
    platform: 'Instagram',
    postUrl: 'https://instagram.com/p/mothers-day-tribute',
    publishedAt: 'May 10, 2026',
  },
  {
    id: 'p11',
    title: 'Monsoon Relief Update',
    type: 'Content Production',
    status: 'PUBLISHED',
    description: 'Short update on the monsoon relief drive with footage from the field.',
    assignee: 'arjun',
    creator: 'ananya',
    reviewers: ['sana'],
    updated: 'Jul 22',
    platform: 'Instagram',
    postUrl: 'https://instagram.com/p/monsoon-relief-update',
    publishedAt: 'Jul 22, 2026',
  },
  {
    id: 'p12',
    title: 'Krishna Janmashtami Reel',
    type: 'Content Production',
    status: 'SCHEDULED',
    description: 'Festive reel scheduled for the Janmashtami morning slot. Approved v1.0.',
    assignee: 'priya',
    creator: 'sana',
    reviewers: ['ananya'],
    updated: '3h ago',
    scheduleDate: 'Oct 15, 2026 · 6:00 AM',
    approvedVersion: 'v1.0',
  },
]

/* ---------- Video review workspace (timestamped comments) ---------- */

export const SAMPLE_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'

export interface VideoComment {
  id: string
  author: string // team member id
  time: number // seconds — click to seek the player
  body: string
  replies: { id: string; author: string; body: string }[]
  resolved: boolean
  createdAt: string
}

export interface VideoVersion {
  id: string
  label: string
  url: string
  uploadedBy: string // team member id
  uploadedAt: string
  summary: string
}

export interface VideoReview {
  fileName: string
  versions: VideoVersion[]
  comments: VideoComment[]
}

export const videoReviews: Record<string, VideoReview> = {
  p1: {
    fileName: 'ashram-ep1-draft.mp4',
    versions: [
      { id: 'v3', label: 'v1.2', url: SAMPLE_VIDEO_URL, uploadedBy: 'priya', uploadedAt: 'Today · 9:40 AM', summary: 'Tightened intro, delayed subtitle, fixed audio dip' },
      { id: 'v2', label: 'v1.1', url: SAMPLE_VIDEO_URL, uploadedBy: 'priya', uploadedAt: 'Yesterday · 6:12 PM', summary: 'Added captions, balanced music under voiceover' },
      { id: 'v1', label: 'v1.0', url: SAMPLE_VIDEO_URL, uploadedBy: 'priya', uploadedAt: 'Mon · 11:02 AM', summary: 'First cut of Episode 1' },
    ],
    comments: [
      {
        id: 'c1',
        author: 'sana',
        time: 2.5,
        body: 'The opening hook is lovely — but can we tighten the first 3 seconds? The title card holds a beat too long.',
        replies: [{ id: 'r1', author: 'priya', body: 'Done in v1.2 — trimmed the card to ~1.5s.', }],
        resolved: true,
        createdAt: 'Yesterday · 4:10 PM',
      },
      {
        id: 'c2',
        author: 'ananya',
        time: 8.2,
        body: 'The subtitle appears before she starts speaking at this point. Delay it slightly so it lands on her first word.',
        replies: [],
        resolved: false,
        createdAt: 'Today · 9:05 AM',
      },
      {
        id: 'c3',
        author: 'arjun',
        time: 11.0,
        body: 'Background music is a touch loud here — dip it under the voiceover so the story stays the focus.',
        replies: [{ id: 'r2', author: 'priya', body: 'Agreed, will fix in the next cut.', }],
        resolved: false,
        createdAt: 'Today · 9:50 AM',
      },
    ],
  },
  p2: {
    fileName: 'pre-pregnancy-reel-draft.mp4',
    versions: [
      { id: 'v2', label: 'v1.1', url: SAMPLE_VIDEO_URL, uploadedBy: 'arjun', uploadedAt: 'Today · 8:15 AM', summary: 'Reworked statistic callouts per feedback' },
      { id: 'v1', label: 'v1.0', url: SAMPLE_VIDEO_URL, uploadedBy: 'arjun', uploadedAt: 'Yesterday · 3:30 PM', summary: 'First pass of the explainer reel' },
    ],
    comments: [
      {
        id: 'c1',
        author: 'sana',
        time: 4.0,
        body: 'The statistic on screen at this moment is hard to read against the footage — add a solid background panel.',
        replies: [],
        resolved: false,
        createdAt: 'Today · 8:40 AM',
      },
      {
        id: 'c2',
        author: 'ananya',
        time: 9.5,
        body: 'Great pacing. The transition into the doctor’s clip could be one frame later.',
        replies: [{ id: 'r1', author: 'arjun', body: 'Will shift it in v1.2.', }],
        resolved: true,
        createdAt: 'Today · 9:12 AM',
      },
    ],
  },
}

/* ---------- Concepts (idea pipeline) ---------- */

export interface Concept {
  id: string
  title: string
  proposer: string // team member id
  type: 'New Concept' | 'Experiment' | 'Revision'
  status: 'IDEA' | 'APPROVED_CONCEPT'
  submitted: string
  description: string
  discussion: string
}

export const concepts: Concept[] = [
  {
    id: 'cn1',
    title: 'Video series on Puranic mothers',
    proposer: 'sana',
    type: 'New Concept',
    status: 'IDEA',
    submitted: '2d ago',
    description: 'A 5-episode series retelling stories of mothers from Puranic texts, tied to modern parenting themes.',
    discussion: 'Raised in Monday sync — team leaning positive, wants one pilot episode first.',
  },
  {
    id: 'cn2',
    title: 'Experiment: vertical reels vs square posts',
    proposer: 'ananya',
    type: 'Experiment',
    status: 'APPROVED_CONCEPT',
    submitted: '5d ago',
    description: 'Publish the same testimonial in vertical and square formats for two weeks and compare reach.',
    discussion: 'Approved — assign an editor and pick a testimonial to test with.',
  },
  {
    id: 'cn3',
    title: 'Pregnancy myth-busting shorts',
    proposer: 'priya',
    type: 'New Concept',
    status: 'IDEA',
    submitted: '1d ago',
    description: '30-second shorts answering common pregnancy myths with a doctor on camera.',
    discussion: 'Needs a doctor guest; Priya is reaching out.',
  },
  {
    id: 'cn4',
    title: 'Revamp older testimonials with new captions',
    proposer: 'arjun',
    type: 'Revision',
    status: 'IDEA',
    submitted: '4d ago',
    description: 'Re-edit three older testimonial videos with the new caption style and branding.',
    discussion: 'Low effort, high value — likely to approve at the next sync.',
  },
]

/* ---------- Scheduling & published projects ---------- */

export const scheduledPosts = [
  {
    id: 'sp1',
    projectId: 'p12',
    title: 'Krishna Janmashtami Reel',
    platform: 'Instagram · YouTube',
    version: 'v1.0',
    scheduledAt: 'Oct 15, 2026 · 6:00 AM',
  },
]

export interface PublishedPost {
  projectId: string
  title: string
  platform: string
  posted: string
  views: string
  likes: string
  comments: number
  shares: number
}

export const publishedPosts: PublishedPost[] = [
  { projectId: 'p10', title: "Mothers' Day Tribute Reel", platform: 'Instagram', posted: 'May 10', views: '48.2K', likes: '6.1K', comments: 342, shares: 1180 },
  { projectId: 'p11', title: 'Monsoon Relief Update', platform: 'Instagram', posted: 'Jul 22', views: '21.7K', likes: '2.4K', comments: 96, shares: 410 },
  { projectId: 'p9', title: 'Ashram Tour — Behind the Scenes', platform: 'YouTube', posted: 'Sep 28', views: '8.9K', likes: '1.2K', comments: 54, shares: 0 },
]

export const dashboardStats = {
  inReview: 3,
  myWork: 5,
  waitingInputs: 2,
  scheduled: 1,
  publishedThisMonth: 8,
}

/* ---------- Inputs (per project) ---------- */

export interface InputItem {
  id: string
  title: string
  owner: string // team member id
  state: 'requested' | 'received' | 'missing' | 'blocked'
  requestedAt: string
  receivedAt?: string
}

export const projectInputs: Record<string, InputItem[]> = {
  p4: [
    { id: 'in1', title: 'Food photography — 8 slides', owner: 'rohan', state: 'received', requestedAt: 'Oct 01', receivedAt: 'Oct 05' },
    { id: 'in2', title: 'Dietitian voice notes (Hindi + English)', owner: 'sana', state: 'requested', requestedAt: 'Oct 03' },
    { id: 'in3', title: 'Brand colour + type guidelines', owner: 'rohan', state: 'received', requestedAt: 'Oct 01', receivedAt: 'Oct 02' },
  ],
  p7: [
    { id: 'in1', title: 'Impact data CSV — Q1–Q3', owner: 'ananya', state: 'received', requestedAt: 'Sep 20', receivedAt: 'Oct 06' },
    { id: 'in2', title: 'Field footage — relief drive', owner: 'arjun', state: 'received', requestedAt: 'Sep 25', receivedAt: 'Oct 08' },
  ],
  p3: [
    { id: 'in1', title: 'Diwali campaign logo + assets', owner: 'rohan', state: 'received', requestedAt: 'Oct 01', receivedAt: 'Oct 04' },
    { id: 'in2', title: 'Voiceover — narrator', owner: 'sana', state: 'requested', requestedAt: 'Oct 06' },
  ],
}

/* ---------- Notifications ---------- */

export const notifications = [
  { id: 'n1', type: 'review', title: 'Draft v1.2 is ready for review', desc: 'Ashram Testimonial — Episode 1 · waiting on your feedback', time: '12m ago', unread: true },
  { id: 'n2', type: 'comment', title: 'Ananya commented at 0:08', desc: '"The subtitle appears before she starts speaking…"', time: '48m ago', unread: true },
  { id: 'n3', type: 'revision', title: 'Revision requested', desc: 'Pre-pregnancy Awareness Reel — 1 open comment to address', time: '2h ago', unread: true },
  { id: 'n4', type: 'approval', title: 'v1.3 approved', desc: 'Yoga Series — Episode 4 · approved by Sana', time: '5h ago', unread: false },
  { id: 'n5', type: 'schedule', title: 'Scheduled for Oct 15 · 6:00 AM', desc: 'Krishna Janmashtami Reel is ready to go live', time: '3h ago', unread: false },
  { id: 'n6', type: 'published', title: 'Went live on Instagram', desc: "Mothers' Day Tribute Reel · 48.2K views", time: '1d ago', unread: false },
]

/* ---------- Activity timeline ---------- */

export const activity = [
  { actor: 'priya', verb: 'uploaded', target: 'draft v1.2 of Ashram Testimonial — Episode 1', time: '2h ago', project: 'p1' },
  { actor: 'ananya', verb: 'commented at 0:08 on', target: 'Ashram Testimonial — Episode 1', time: '48m ago', project: 'p1' },
  { actor: 'sana', verb: 'requested a revision on', target: 'Pre-pregnancy Awareness Reel', time: '2h ago', project: 'p2' },
  { actor: 'rohan', verb: 'received input', target: 'Food photography — Post-natal Nutrition Carousel', time: '5h ago', project: 'p4' },
  { actor: 'sana', verb: 'approved', target: 'v1.3 of Yoga Series — Episode 4', time: '5h ago', project: 'p5' },
  { actor: 'ananya', verb: 'approved concept', target: 'Experiment: vertical reels vs square posts', time: '1d ago', project: 'p8' },
  { actor: 'meera', verb: 'scheduled', target: 'Krishna Janmashtami Reel for Oct 15', time: '3h ago', project: 'p12' },
]

/* ---------- Board (task kanban) ---------- */

export const kanban = [
  {
    column: 'Backlog',
    count: 4,
    accent: 'neutral' as const,
    cards: [
      { id: 't1', project: 'p3', title: 'Write hero caption for Diwali reel', assignee: 'sana', due: 'Oct 14', priority: 'High' },
      { id: 't2', project: 'p8', title: 'Pick host for Kids’ Story Corner pilot', assignee: 'ananya', due: 'Oct 20', priority: 'Medium' },
      { id: 't3', project: 'p4', title: 'Draft carousel slide copy', assignee: 'rohan', due: 'Oct 22', priority: 'Low' },
    ],
  },
  {
    column: 'In Progress',
    count: 3,
    accent: 'teal' as const,
    cards: [
      { id: 't4', project: 'p3', title: 'Assemble hero video cut', assignee: 'arjun', due: 'Oct 12', priority: 'High' },
      { id: 't5', project: 'p1', title: 'Fix audio dip at 0:11', assignee: 'priya', due: 'Today', priority: 'High' },
      { id: 't6', project: 'p7', title: 'Structure impact report timeline', assignee: 'arjun', due: 'Oct 18', priority: 'Medium' },
    ],
  },
  {
    column: 'In Review',
    count: 2,
    accent: 'warning' as const,
    cards: [
      { id: 't7', project: 'p1', title: 'Review draft v1.2 — Episode 1', assignee: 'sana', due: 'Today', priority: 'High' },
      { id: 't8', project: 'p2', title: 'Approve reel after revision', assignee: 'sana', due: 'Oct 13', priority: 'Medium' },
    ],
  },
  {
    column: 'Done',
    count: 5,
    accent: 'success' as const,
    cards: [
      { id: 't9', project: 'p5', title: 'Yoga Episode 4 — final cut approved', assignee: 'priya', due: 'Oct 02', priority: 'Low' },
      { id: 't10', project: 'p10', title: 'Tribute reel — published', assignee: 'priya', due: 'May 10', priority: 'Medium' },
    ],
  },
]

/* ---------- Team chat ---------- */

export const chatChannels = [
  { id: 'c1', name: '#production', desc: 'Drafts, uploads, blockers', unread: 3 },
  { id: 'c2', name: '#announcements', desc: 'Team-wide updates', unread: 0 },
  { id: 'c3', name: '#design-crit', desc: 'Visual feedback sessions', unread: 1 },
  { id: 'c4', name: '#random', desc: 'Watercooler', unread: 0 },
]

export const chatMessages = [
  { id: 'm1', author: 'priya', text: 'Draft v1.2 is up — applied the review feedback on the intro.', time: '10:42 AM' },
  { id: 'm2', author: 'ananya', text: 'Watching it now, leaving a comment at 0:08.', time: '10:47 AM' },
  { id: 'm3', author: 'arjun', text: 'Raw footage links are in the project inputs.', time: '10:51 AM' },
  { id: 'm4', author: 'sana', text: 'Impact data CSV uploaded to the report project.', time: '10:55 AM' },
  { id: 'm5', author: 'priya', text: 'Perfect — folding it into the report cut tonight.', time: '11:02 AM' },
]
