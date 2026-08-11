/**
 * Mock data mirroring the Aaryajanani Stitch designs.
 * Realistic Indian editorial content-ops names, statuses and timestamps
 * so every screen renders true to the design system before backend integration.
 */

export const org = {
  id: 'org_nls',
  name: 'Northern Lights Studio',
  slug: 'northern-lights',
}

export const currentUser = {
  id: 'usr_ananya',
  name: 'Ananya Rao',
  email: 'ananya@northernlights.studio',
  initials: 'AR',
  role: 'admin',
}

export const members = [
  { id: 'u1', name: 'Ananya Rao', email: 'ananya@northernlights.studio', initials: 'AR', role: 'Admin', lastActive: '2m ago' },
  { id: 'u2', name: 'Elena K.', email: 'elena@northernlights.studio', initials: 'EK', role: 'Editor', lastActive: '18m ago' },
  { id: 'u3', name: 'Marcus R.', email: 'marcus@northernlights.studio', initials: 'MR', role: 'Editor', lastActive: '1h ago' },
  { id: 'u4', name: 'Sarah L.', email: 'sarah@northernlights.studio', initials: 'SL', role: 'Reviewer', lastActive: '3h ago' },
  { id: 'u5', name: 'Dev P.', email: 'dev@northernlights.studio', initials: 'DP', role: 'Writer', lastActive: '5h ago' },
  { id: 'u6', name: 'Tom W.', email: 'tom@northernlights.studio', initials: 'TW', role: 'Writer', lastActive: 'Yesterday' },
  { id: 'u7', name: 'Maya K.', email: 'maya@northernlights.studio', initials: 'MK', role: 'Publisher', lastActive: 'Yesterday' },
  { id: 'u8', name: 'Sam J.', email: 'sam@northernlights.studio', initials: 'SJ', role: 'Reviewer', lastActive: '2d ago' },
]

export const projects = [
  { id: 'p1', name: 'Winter Lookbook Editorial', client: 'Aurora Retail', status: 'Active', deadline: 'Oct 14', updated: '2h ago' },
  { id: 'p2', name: 'Summer Sustainability Report', client: 'Verdant Foods', status: 'In Review', deadline: 'Oct 18', updated: '4h ago' },
  { id: 'p3', name: 'Festive Season Campaign', client: 'Golden Thread', status: 'Active', deadline: 'Nov 02', updated: '6h ago' },
  { id: 'p4', name: 'Product Launch Stories', client: 'Nimbus Tech', status: 'Draft', deadline: 'Nov 09', updated: '1d ago' },
  { id: 'p5', name: 'Founder Interview Series', client: 'Pioneer Capital', status: 'Active', deadline: 'Oct 21', updated: '1d ago' },
  { id: 'p6', name: 'Annual Brand Report', client: 'Aurora Retail', status: 'In Review', deadline: 'Oct 28', updated: '2d ago' },
  { id: 'p7', name: 'Regional Expansion Notes', client: 'Verdant Foods', status: 'Draft', deadline: 'Nov 16', updated: '3d ago' },
  { id: 'p8', name: 'Diwali Campaign Assets', client: 'Golden Thread', status: 'Active', deadline: 'Oct 25', updated: '3d ago' },
]

export const kanban = [
  {
    column: 'Backlog',
    count: 8,
    accent: 'neutral',
    cards: [
      { id: 't1', tag: 'Winter Lookbook', title: 'Draft lookbook intro copy', assignee: 'EK', due: 'Oct 14', priority: 'High' },
      { id: 't2', tag: 'Product Launch', title: 'Interview brief for founders', assignee: 'MR', due: 'Oct 20', priority: 'Medium' },
      { id: 't3', tag: 'Summer Report', title: 'Collect Q3 market data', assignee: 'DP', due: 'Oct 22', priority: 'Low' },
    ],
  },
  {
    column: 'In Progress',
    count: 5,
    accent: 'teal',
    cards: [
      { id: 't4', tag: 'Festive Campaign', title: 'Write hero copy v2', assignee: 'AR', due: 'Oct 12', priority: 'High' },
      { id: 't5', tag: 'Winter Lookbook', title: 'Select hero photography', assignee: 'TW', due: 'Oct 15', priority: 'Medium' },
    ],
  },
  {
    column: 'In Review',
    count: 3,
    accent: 'warning',
    cards: [
      { id: 't6', tag: 'Summer Report', title: 'Editorial review of draft', assignee: 'SL', due: 'Oct 11', priority: 'High' },
      { id: 't7', tag: 'Founder Series', title: 'Fact-check interview quotes', assignee: 'SJ', due: 'Oct 13', priority: 'Medium' },
    ],
  },
  {
    column: 'Published',
    count: 12,
    accent: 'success',
    cards: [
      { id: 't8', tag: 'Brand Report', title: 'Annual report — final', assignee: 'MK', due: 'Sep 30', priority: 'Low' },
      { id: 't9', tag: 'Launch Stories', title: 'Nimbus launch case study', assignee: 'MK', due: 'Sep 24', priority: 'Medium' },
    ],
  },
]

export const briefs = [
  { id: 'BRF-2041', title: 'Summer Sustainability Report', project: 'Summer Sustainability Report', writer: 'EK', status: 'In Review', deadline: 'Oct 18', words: '2,500' },
  { id: 'BRF-2040', title: 'Festive Season Campaign Brief', project: 'Festive Season Campaign', writer: 'AR', status: 'Approved', deadline: 'Nov 02', words: '1,800' },
  { id: 'BRF-2039', title: 'Founder Interview Guidelines', project: 'Founder Interview Series', writer: 'MR', status: 'Draft', deadline: 'Oct 21', words: '1,200' },
  { id: 'BRF-2038', title: 'Winter Lookbook Direction', project: 'Winter Lookbook Editorial', writer: 'EK', status: 'Approved', deadline: 'Oct 14', words: '2,000' },
  { id: 'BRF-2037', title: 'Diwali Campaign Asset Notes', project: 'Diwali Campaign Assets', writer: 'TW', status: 'Draft', deadline: 'Oct 25', words: '900' },
  { id: 'BRF-2036', title: 'Annual Brand Report Scope', project: 'Annual Brand Report', writer: 'SL', status: 'In Review', deadline: 'Oct 28', words: '3,000' },
]

export const publications = [
  { id: 'pub1', title: 'Summer Sustainability Report', date: 'Oct 02, 2026', status: 'Live', authors: ['EK', 'SL'], platforms: ['Web', 'PDF'] },
  { id: 'pub2', title: 'Winter Lookbook — Launch Film', date: 'Sep 28, 2026', status: 'Live', authors: ['AR'], platforms: ['YT'] },
  { id: 'pub3', title: 'Founder Interview — Episode 4', date: 'Oct 05, 2026', status: 'Scheduled', authors: ['MR', 'DP'], platforms: ['Web', 'YT'] },
  { id: 'pub4', title: 'Product Launch Stories — Nimbus', date: 'Oct 09, 2026', status: 'Draft', authors: ['MK'], platforms: ['Web'] },
  { id: 'pub5', title: 'Diwali Campaign Trailer', date: 'Oct 20, 2026', status: 'Scheduled', authors: ['TW', 'MK'], platforms: ['YT', 'IG'] },
  { id: 'pub6', title: 'Annual Brand Report 2026', date: 'Nov 01, 2026', status: 'Draft', authors: ['EK', 'SL'], platforms: ['PDF'] },
]

export const versions = [
  { id: 'v3', tag: 'v1.2', date: 'Oct 24, 2026 · 10:45 AM', author: 'Elena K.', initials: 'EK', status: 'Current', summary: 'Applied client feedback round 2' },
  { id: 'v2', tag: 'v1.1', date: 'Oct 22, 2026 · 4:12 PM', author: 'Elena K.', initials: 'EK', status: 'Approved', summary: 'Added Q3 market data section' },
  { id: 'v1', tag: 'v1.0', date: 'Oct 18, 2026 · 9:30 AM', author: 'Ananya Rao', initials: 'AR', status: 'Draft', summary: 'Initial draft from brief BRF-2041' },
]

export const notifications = [
  { id: 'n1', type: 'mention', title: 'Elena mentioned you in a comment', desc: '"@Ananya, can you review the hero copy on Draft 2?"', time: '12m ago', unread: true },
  { id: 'n2', type: 'approval', title: 'Version v1.1 is ready for approval', desc: 'Summer Sustainability Report — pending your review', time: '48m ago', unread: true },
  { id: 'n3', type: 'deadline', title: 'Deadline approaching — Oct 14', desc: 'Winter Lookbook Editorial is due in 3 days', time: '2h ago', unread: true },
  { id: 'n4', type: 'comment', title: 'Marcus commented on Festival Brief', desc: 'Loved the tone. Minor tweak on section 3.', time: '5h ago', unread: false },
  { id: 'n5', type: 'approval', title: 'Contract signed — Aurora Retail', desc: 'Winter Lookbook contract has been signed', time: '1d ago', unread: false },
  { id: 'n6', type: 'mention', title: 'Dev mentioned you in #production', desc: 'Uploading the raw footage links now', time: '1d ago', unread: false },
]

export const activity = [
  { actor: 'EK', name: 'Elena K.', verb: 'created version', target: 'v1.2 of Summer Sustainability Report', time: '2h ago', project: 'Summer Report' },
  { actor: 'MR', name: 'Marcus R.', verb: 'approved', target: 'Festive Campaign Brief', time: '4h ago', project: 'Festive Campaign' },
  { actor: 'AR', name: 'Ananya Rao', verb: 'transitioned', target: 'Winter Lookbook to IN_REVIEW', time: '6h ago', project: 'Winter Lookbook' },
  { actor: 'TW', name: 'Tom W.', verb: 'uploaded input', target: 'Raw footage — Diwali Campaign', time: '8h ago', project: 'Diwali Campaign' },
  { actor: 'MK', name: 'Maya K.', verb: 'published', target: 'Winter Lookbook — Launch Film', time: '1d ago', project: 'Winter Lookbook' },
  { actor: 'SL', name: 'Sarah L.', verb: 'requested revision', target: 'Annual Brand Report — Section 2', time: '1d ago', project: 'Brand Report' },
]

export const contracts = [
  { id: 'CT-3012', client: 'Aurora Retail', type: 'Retainer', value: '₹4,80,000', status: 'Active', start: 'Aug 01, 2026', end: 'Jan 31, 2027' },
  { id: 'CT-3011', client: 'Verdant Foods', type: 'Project', value: '₹2,40,000', status: 'Active', start: 'Sep 01, 2026', end: 'Dec 15, 2026' },
  { id: 'CT-3010', client: 'Golden Thread', type: 'Retainer', value: '₹3,60,000', status: 'Draft', start: '—', end: '—' },
  { id: 'CT-3009', client: 'Nimbus Tech', type: 'One-off', value: '₹1,10,000', status: 'Active', start: 'Sep 15, 2026', end: 'Nov 15, 2026' },
  { id: 'CT-3008', client: 'Pioneer Capital', type: 'Project', value: '₹1,80,000', status: 'Expired', start: 'Mar 01, 2026', end: 'Aug 31, 2026' },
  { id: 'CT-3007', client: 'Aurora Retail', type: 'One-off', value: '₹85,000', status: 'Expired', start: 'Feb 01, 2026', end: 'Jun 30, 2026' },
]

export const invoices = [
  { id: 'INV-2026-014', client: 'Aurora Retail', amount: '₹1,20,000', due: 'Nov 05, 2026', status: 'Pending' },
  { id: 'INV-2026-013', client: 'Verdant Foods', amount: '₹80,000', due: 'Oct 28, 2026', status: 'Pending' },
  { id: 'INV-2026-012', client: 'Nimbus Tech', amount: '₹1,10,000', due: 'Oct 15, 2026', status: 'Paid' },
  { id: 'INV-2026-011', client: 'Aurora Retail', amount: '₹1,20,000', due: 'Oct 05, 2026', status: 'Paid' },
  { id: 'INV-2026-010', client: 'Golden Thread', amount: '₹45,000', due: 'Sep 30, 2026', status: 'Overdue' },
  { id: 'INV-2026-009', client: 'Pioneer Capital', amount: '₹1,80,000', due: 'Sep 20, 2026', status: 'Overdue' },
]

export const chatChannels = [
  { id: 'c1', name: '#production', desc: 'Daily ops, uploads, blockers', unread: 3 },
  { id: 'c2', name: '#announcements', desc: 'Studio-wide updates', unread: 0 },
  { id: 'c3', name: '#design-crit', desc: 'Visual feedback sessions', unread: 1 },
  { id: 'c4', name: '#random', desc: 'Watercooler', unread: 0 },
]

export const chatMessages = [
  { id: 'm1', author: 'Elena K.', initials: 'EK', text: 'Draft v1.2 is up — applied the client feedback on tone.', time: '10:42 AM' },
  { id: 'm2', author: 'Ananya Rao', initials: 'AR', text: 'Nice. I’ll do a final pass before sending to review.', time: '10:47 AM' },
  { id: 'm3', author: 'Marcus R.', initials: 'MR', text: 'Raw footage links are in the inputs inbox.', time: '10:51 AM' },
  { id: 'm4', author: 'Dev P.', initials: 'DP', text: 'Q3 data CSV uploaded to the report project.', time: '10:55 AM' },
  { id: 'm5', author: 'Elena K.', initials: 'EK', text: 'Perfect — I’ll fold it into section 3 tonight.', time: '11:02 AM' },
]

export const inputs = [
  { id: 'i1', title: 'Raw footage — Diwali Campaign', source: 'File', time: '2h ago', unread: true },
  { id: 'i2', title: 'Q3 Market Data CSV', source: 'Email', time: '5h ago', unread: true },
  { id: 'i3', title: 'Voice note — client kickoff', source: 'Voice', time: '1d ago', unread: false },
  { id: 'i4', title: 'Brand guidelines PDF', source: 'File', time: '2d ago', unread: false },
  { id: 'i5', title: 'Briefing call transcript', source: 'Text', time: '3d ago', unread: false },
]

export const metrics = {
  activeProjects: 12,
  pendingReviews: 4,
  publishedThisMonth: 8,
  openInvoices: 3,
}
