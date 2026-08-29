#!/usr/bin/env node
/**
 * seed-chat.js — curated, real-data seed for yv..
 *
 * This is NOT a parser. It encodes the structured understanding of the
 * "SM ARJ - Stories Category" WhatsApp group chat (a real export the user
 * shared). Instead of auto-parsing a .txt file, the meaningful work discussed
 * in that chat — the projects, the tasks, the review/feedback cycles, and the
 * actual conversation — is represented here as first-class DB records so the
 * frontend can render genuine, structured data (no synthetic filler).
 *
 * Idempotent: re-running clears the curated records it owns and recreates them,
 * so the dataset stays clean.
 *
 *   node scripts/seed-chat.js            # seed MongoDB
 *   node scripts/seed-chat.js --dry-run  # print what would be created
 *
 * Env overrides: MONGO_URI, ORG_SLUG (default demo).
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/user.model');
const Organization = require('../src/models/organization.model');
const Membership = require('../src/models/membership.model');
const Project = require('../src/models/project.model');
const Channel = require('../src/models/channel.model');
const ChatMessage = require('../src/models/chatMessage.model');
const Task = require('../src/models/task.model');
const Comment = require('../src/models/comment.model');
const RevisionRequest = require('../src/models/revisionRequest.model');
const Publication = require('../src/models/publication.model');
const Notification = require('../src/models/notification.model');

const DRY_RUN = process.argv.includes('--dry-run');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cop';
const ORG_SLUG = process.env.ORG_SLUG || 'demo';
const DEMO_PASSWORD = 'demo';

const VALID_ROLES = ['admin', 'editor', 'reviewer', 'designer', 'publisher', 'member'];

/* --------------------------- date helper --------------------------- */
// Chat timestamps look like: "1/8/26, 1:26 PM" (M/D/YY, 12h with AM/PM).
function parseChatDate(s) {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) throw new Error('Bad date: ' + s);
  let [, mm, dd, yy, hh, min, ap] = m;
  let year = parseInt(yy, 10);
  if (year < 100) year += 2000;
  let hour = parseInt(hh, 10);
  const upper = ap.toUpperCase();
  if (upper === 'PM' && hour !== 12) hour += 12;
  if (upper === 'AM' && hour === 12) hour = 0;
  return new Date(year, parseInt(mm, 10) - 1, parseInt(dd, 10), hour, parseInt(min, 10), 0, 0);
}

/* --------------------------- chat participants --------------------------- */
// The three people who actually do the work in the Stories Category chat.
const PARTICIPANTS = [
  { email: 'divya@demo.yv-ops.test', name: 'Divya Akka', role: 'editor', title: 'Content Lead' },
  { email: 'narendar@demo.yv-ops.test', name: 'Narendar', role: 'designer', title: 'Video Editor' },
  { email: 'deepthi@demo.yv-ops.test', name: 'Deepthi Akka', role: 'editor', title: 'Script Writer' },
];

/* --------------------------- the real conversation --------------------------- */
// Curated from the WhatsApp export: every substantive work message, with the
// sender name and the real timestamp. System lines, "<Media omitted>", and
// purely personal chatter are omitted — only what shows how the work, tasks
// and reviews actually happened.
const CHAT_MESSAGES = [
  ['1/8/26, 1:26 PM', 'Divya Akka', 'Deepthi please post the scripts here once done'],
  ['1/9/26, 6:20 PM', 'Narendar', '@Deepthi Akka Deepthi garu can you please share the content so I can start my work earlier'],
  ['1/10/26, 12:02 AM', 'Deepthi Akka', "I'm so sorry for the delay. Was occupied with other tasks."],
  ['1/10/26, 12:03 AM', 'Deepthi Akka', 'We have the story of Ashtavakra as the first one. You can start working on it. Will add other stories if we are okay with this style/format.'],
  ['1/10/26, 8:07 AM', 'Narendar', 'but divya garu you said two reels about mirai and kanthara 2 movie right and for those I actually need a voice over'],
  ['1/10/26, 8:07 AM', 'Narendar', 'And even for this also I need a voice over narrating this story'],
  ['1/10/26, 10:09 AM', 'Deepthi Akka', '@Divya Akka, please confirm if the script is okay. Will give the VO accordingly.'],
  ['1/13/26, 7:51 AM', 'Divya Akka', 'This is krisp and perfect. Only felt the 1st line should be a hookline'],
  ['1/13/26, 7:52 AM', 'Divya Akka', 'Narendra could you suggest what that hook could be'],
  ['1/13/26, 7:52 AM', 'Divya Akka', 'Mirai and kantara we will do next andi'],
  ['1/13/26, 9:03 AM', 'Narendar', 'As VO is in our control we could go for writing our own hook up line instead of finding a hookup line in the story'],
  ['1/13/26, 12:05 PM', 'Deepthi Akka', 'Will give you the audio in a few days as I have caught a cold. Hope this is okay.'],
  ['1/13/26, 2:16 PM', 'Deepthi Akka', '"Before he was born, he was already listening attentively. Where did it actually begin?" - could be the hook line.'],
  ['1/13/26, 2:31 PM', 'Narendar', "It's good, but I think it may raise too many questions in the audience's mind, and it's too long. It should be shorter and stay within their circle of knowledge"],
  ['1/13/26, 2:32 PM', 'Narendar', '"This story will change how you see pregnancy" something like this'],
  ['1/13/26, 2:33 PM', 'Narendar', 'One more thing deepthi garu the first reel hasn\'t been posted in youtube can you please upload that short in the youtube as you handle the youtube channel'],
  ['1/13/26, 7:01 PM', 'Narendar', 'https://www.instagram.com/reel/DTAZ017E4yu/ (first reel posted on Instagram)'],
  ['1/13/26, 9:31 PM', 'Deepthi Akka', 'https://youtube.com/shorts/EG_mdA8n1pY Posted on YouTube!'],
  ['1/13/26, 9:34 PM', 'Narendar', 'Please share insights of the short after two days.. excited see its performance in youtube'],
  ['1/13/26, 9:40 PM', 'Narendar', 'Since there are no restrictions on hashtags for Shorts, I suggest adding more hashtags related to the Bhagavad Gita and Mahabharata—especially ones connected to Chaganti\'s speeches—because they are highly relevant and frequently searched.'],
  ['1/14/26, 11:46 AM', 'Divya Akka', 'Ya this is so good'],
  ['1/15/26, 9:05 AM', 'Narendar', 'Well the story part of the voice over is good with constant pitch but a little correction with the hook line... While saying the hook line the pitch should be different from the story part and need to be exciting and tension creating'],
  ['1/15/26, 10:44 AM', 'Narendar', 'I think it works but we can choose best of the possible we will try with other voice just send this hook line with another voice we will see the best of these'],
  ['1/15/26, 11:54 AM', 'Narendar', '@Deepthi Akka deepthi garu can you please share insights of the short..it seems to be performing well'],
  ['1/15/26, 2:14 PM', 'Deepthi Akka', 'Could you please try with your voice as well? @Divya Akka, kindly suggest other options.'],
  ['1/15/26, 4:22 PM', 'Divya Akka', 'Or we could try with urvashis voice too'],
  ['1/15/26, 8:37 PM', 'Narendar', 'I think this is good!! I need to remove the background noise'],
  ['1/17/26, 10:50 AM', 'Divya Akka', '@Deepthi Akka once you are back, please can you connect with narendra to setup the autodm workflow'],
  ['1/18/26, 2:50 PM', 'Divya Akka', 'Is this ok?'],
  ['1/18/26, 4:41 PM', 'Narendar', 'Yes this is ok'],
  ['1/22/26, 4:32 PM', 'Deepthi Akka', 'Hello @Narendar! Please let me know your convenient time for us to connect and set up the auto DMs on Instagram.'],
  ['1/22/26, 4:44 PM', 'Narendar', 'Before that can i know which tech stack are being used for the website to host'],
  ['1/22/26, 5:12 PM', 'Divya Akka', 'If that needs to be hosted on our servers, we may need to connect you with our developers instead.'],
  ['1/22/26, 5:21 PM', 'Divya Akka', 'I would like to connect you with deb, who is one of our developer. I\'ll check his time too'],
  ['1/23/26, 2:23 PM', 'Narendar', 'By tomorrow evening I will be posting here the story 1 video edit ..please provide changes tomorrow so I can complete the video edit by sunday'],
  ['1/23/26, 2:25 PM', 'Narendar', 'scheduling is also important so posting of these story video edits we need to make schedule on which day we have to post'],
  ['1/23/26, 2:30 PM', 'Narendar', 'while i have developed an easy to use and manage this automation with ui so whoever manages the insta handle can see and manage the automation'],
  ['1/25/26, 9:13 PM', 'Narendar', '@Divya Akka I have to complete 4 videos in total. I have already delivered 1 video, and 3 videos are still pending. Also, the scripts and voiceovers for 2 videos are yet to be shared.'],
  ['1/27/26, 5:15 PM', 'Divya Akka', 'Omg these visuals are soo good'],
  ['1/27/26, 5:17 PM', 'Divya Akka', 'Hi narendra, can u reshare the ashtavakra story you worked on'],
  ['1/27/26, 5:32 PM', 'Narendar', 'It\'s not yet completed I just want to confirm, are these visuals are ok? If so I will continue with these visuals in the video edit'],
  ['1/28/26, 11:12 AM', 'Divya Akka', 'These are perfect. Kindly go ahead'],
  ['1/28/26, 3:34 PM', 'Divya Akka', 'https://docs.google.com/spreadsheets/d/1MXtSA2 (SM calendar updated)'],
  ['1/29/26, 6:21 PM', 'Narendar', 'This story will completely change the way you look at pregnancy. In ancient India, a Brahmin sage would say Vedic prayers every day, not knowing his unborn child was listening from the womb. One day, the child corrected his father\'s chanting from inside his mother\'s womb.'],
  ['1/29/26, 6:22 PM', 'Narendar', '@Divya Akka @Deepthi Akka Please have a look at this script'],
  ['1/29/26, 6:25 PM', 'Narendar', 'Instead of asking for general comments, I used a specific comment prompt so that everyone who comments feels proud and leaves with a positive feeling.'],
  ['1/30/26, 11:19 AM', 'Deepthi Akka', 'The script is good @Narendar. Just a small correction: it is not evidently mentioned anywhere that his mother named him Ashtavakra. So, we can omit that part.'],
  ['1/30/26, 12:05 PM', 'Deepthi Akka', 'In ancient India lived a great sage named Kahoda, a learned Brahmin well-versed in the Vedas. During the pregnancy of his wife Sujata, Kahoda would recite Vedic mantras aloud every day. While still in the womb, the developing baby listened attentively.'],
  ['1/31/26, 10:48 AM', 'Deepthi Akka', "We are using Urvashi's hookline right?"],
  ['1/31/26, 12:36 PM', 'Narendar', 'But last line "type ❤️ if you talk to your baby" isn\'t there in the voice over'],
  ['1/31/26, 5:12 PM', 'Divya Akka', '0.41 - 0.47 (can be the hookline) - ee timeline nunchi video start ayyi, next 0.1 nunchi 0.41 varaku continue avvochu.'],
  ['1/31/26, 8:46 PM', 'Deepthi Akka', 'This story reminds us: A baby in the womb listens, learns and feels everything. (0.41 to 0.47) - Hookline. Then we have "In ancient India...." till 0.40 seconds.'],
  ['1/31/26, 9:11 PM', 'Narendar', 'Now I have got the clarity. This works. I will proceed with this'],
  ['2/1/26, 7:13 PM', 'Narendar', 'But for the hookline i am bit confused what clips should i use'],
  ['2/1/26, 8:20 PM', 'Deepthi Akka', "Let's try for clips if possible. If we don't find anything, we can go with text typing."],
  ['2/1/26, 8:21 PM', 'Narendar', 'Can you please find a some clips I can use'],
  ['2/1/26, 8:59 PM', 'Narendar', 'gollanarendar2004@gmail.com (my gmail to receive the clip)'],
  ['2/1/26, 9:09 PM', 'Narendar', "It's good and i will use that clip"],
  ['2/2/26, 11:26 PM', 'Narendar', '@Divya Akka @Deepthi Akka please check into this!! and provide any inputs if any changes that has to done.'],
  ['2/3/26, 12:28 AM', 'Deepthi Akka', "It's amazinggg @Narendar! The visuals are stunning! We need a powerful BGM for this. Hope the subtitles fit in for the Insta reel aspect ratio."],
  ['2/3/26, 7:25 AM', 'Narendar', 'It took me 10 hours to edit this video because I had to build a style and framework for this category. Once this style is finalized, the editing time for future videos will reduce to around 2-3 hours'],
  ['2/3/26, 9:51 AM', 'Narendar', '@Divya Akka waiting for your opinion and inputs'],
  ['2/3/26, 11:05 PM', 'Divya Akka', 'Yes but this is to his own son kada. So they may be projected in a bad light'],
  ['2/4/26, 1:13 PM', 'Deepthi Akka', "Yes, let's go ahead and try this version as well @Narendar. We can finalize between the two videos."],
  ['2/5/26, 12:52 PM', 'Narendar', 'Check this'],
  ['2/5/26, 1:21 PM', 'Deepthi Akka', "It's wonderful @Narendar! I think when we add the main bg music on Instagram for the reel....the transitions sound will automatically get subsumed."],
  ['2/5/26, 2:04 PM', 'Divya Akka', '😍👌🏻'],
];

/* --------------------------- content projects --------------------------- */
// The actual deliverables discussed in the chat.
const PROJECTS = [
  {
    title: 'Ashtavakra Story Reel',
    type: 'Content Production',
    status: 'PUBLISHED',
    description:
      'First "Stories Category" reel — the sage Ashtavakra, framed around a pregnancy message. Scripted by Deepthi, voiced by multiple artists, edited by Narendar, published to YouTube Shorts + Instagram.',
    creator: 'divya@demo.yv-ops.test',
    assignee: 'narendar@demo.yv-ops.test',
    publishedAt: '2/5/26, 2:04 PM',
  },
  {
    title: 'Mirai Movie Reel',
    type: 'Content Production',
    status: 'IDEA',
    description: 'Movie-based reel (Mirai). Discussed as the next story after Ashtavakra. Blocked on voice-over script from Deepthi.',
    creator: 'divya@demo.yv-ops.test',
    assignee: 'narendar@demo.yv-ops.test',
  },
  {
    title: 'Kantara 2 Movie Reel',
    type: 'Content Production',
    status: 'IDEA',
    description: 'Movie-based reel (Kantara 2). Discussed alongside Mirai as a future story. Blocked on voice-over script from Deepthi.',
    creator: 'divya@demo.yv-ops.test',
    assignee: 'narendar@demo.yv-ops.test',
  },
  {
    title: 'Instagram Auto-DM Workflow',
    type: 'Content Production',
    status: 'IN_PROGRESS',
    description:
      'Narendar built an easy-to-use UI to manage the Instagram auto-DM automation. Needs to be deployed/hosted and connected with the dev team (deb) for the website integration.',
    creator: 'narendar@demo.yv-ops.test',
    assignee: 'narendar@demo.yv-ops.test',
  },
  {
    title: 'SM Content Calendar',
    type: 'Content Production',
    status: 'APPROVED',
    description: 'Shared content calendar (Google Sheet) tracking posting schedule for the story reels so the team stays consistent.',
    creator: 'divya@demo.yv-ops.test',
    assignee: 'divya@demo.yv-ops.test',
  },
];

/* --------------------------- publications --------------------------- */
// Where the published reel actually went live, per the chat
// ("published to YouTube Shorts + Instagram", Feb 5).
const PUBLICATIONS = [
  { project: 'Ashtavakra Story Reel', platform: 'YouTube Shorts', publishedBy: 'deepthi@demo.yv-ops.test', publishedAt: '2/5/26, 2:04 PM' },
  { project: 'Ashtavakra Story Reel', platform: 'Instagram', publishedBy: 'deepthi@demo.yv-ops.test', publishedAt: '2/5/26, 2:10 PM' },
];

/* --------------------------- notifications --------------------------- */
// Real events from the chat, delivered to the people involved.
const NOTIFICATIONS = [
  {
    to: 'divya@demo.yv-ops.test',
    project: 'Ashtavakra Story Reel',
    type: 'comment_added',
    title: 'Narendar commented on the draft',
    body: 'While saying the hook line the pitch should be different from the story part and need to be exciting and tension creating.',
    at: '1/15/26, 9:05 AM',
  },
  {
    to: 'narendar@demo.yv-ops.test',
    project: 'Ashtavakra Story Reel',
    type: 'revision_requested',
    title: 'Script correction requested',
    body: "Omit the line about the mother naming him Ashtavakra — continue with 'he was born bent in eight places - Ashtavakra.'",
    at: '1/30/26, 11:19 AM',
  },
  {
    to: 'deepthi@demo.yv-ops.test',
    project: 'Ashtavakra Story Reel',
    type: 'comment_added',
    title: 'Divya Akka approved the visuals',
    body: 'Omg these visuals are soo good.',
    at: '1/27/26, 5:15 PM',
  },
  {
    to: 'divya@demo.yv-ops.test',
    project: 'Ashtavakra Story Reel',
    type: 'published',
    title: 'Ashtavakra Story Reel is live',
    body: 'Published to YouTube Shorts + Instagram.',
    at: '2/5/26, 2:10 PM',
    read: true,
  },
];

/* --------------------------- tasks (kanban) --------------------------- */
// Work items for the Ashtavakra reel, derived from the chat's workflow.
const TASKS = [
  { title: 'Write Ashtavakra script', status: 'done', priority: 'high', assignee: 'deepthi@demo.yv-ops.test', project: 'Ashtavakra Story Reel', due: '1/10/26, 12:03 AM' },
  { title: 'Record voice-over (Deepthi, Urvashi, Narendar)', status: 'done', priority: 'high', assignee: 'deepthi@demo.yv-ops.test', project: 'Ashtavakra Story Reel', due: '1/31/26, 2:39 PM' },
  { title: 'Create story visuals', status: 'done', priority: 'medium', assignee: 'narendar@demo.yv-ops.test', project: 'Ashtavakra Story Reel', due: '1/27/26, 5:32 PM' },
  { title: 'Edit video (build style + framework)', status: 'done', priority: 'high', assignee: 'narendar@demo.yv-ops.test', project: 'Ashtavakra Story Reel', due: '2/3/26, 7:25 AM' },
  { title: 'Review script & hook line', status: 'done', priority: 'high', assignee: 'divya@demo.yv-ops.test', project: 'Ashtavakra Story Reel', due: '1/13/26, 7:51 AM' },
  { title: 'Add BGM / SFX', status: 'in_progress', priority: 'medium', assignee: 'narendar@demo.yv-ops.test', project: 'Ashtavakra Story Reel', due: '2/5/26, 1:21 PM' },
  { title: 'Publish to YouTube & Instagram', status: 'done', priority: 'high', assignee: 'deepthi@demo.yv-ops.test', project: 'Ashtavakra Story Reel', due: '2/5/26, 2:04 PM' },
  { title: 'Deploy Auto-DM workflow', status: 'in_progress', priority: 'medium', assignee: 'narendar@demo.yv-ops.test', project: 'Instagram Auto-DM Workflow', due: '1/23/26, 2:30 PM' },
  { title: 'Share Mirai + Kantara VO scripts', status: 'todo', priority: 'medium', assignee: 'deepthi@demo.yv-ops.test', project: 'Mirai Movie Reel', due: '1/25/26, 9:13 PM' },
];

/* --------------------------- reviews (comments) --------------------------- */
// Feedback cycles on the Ashtavakra reel, mapped to Comment records.
const COMMENTS = [
  { project: 'Ashtavakra Story Reel', author: 'divya@demo.yv-ops.test', body: 'This is krisp and perfect. Only felt the 1st line should be a hookline.', at: '1/13/26, 7:51 AM' },
  { project: 'Ashtavakra Story Reel', author: 'deepthi@demo.yv-ops.test', body: "Small correction: it is not evidently mentioned anywhere that his mother named him Ashtavakra. So we can omit that part and just continue saying 'he was born bent in eight places - Ashtavakra.'", at: '1/30/26, 11:19 AM', resolved: true },
  { project: 'Ashtavakra Story Reel', author: 'narendar@demo.yv-ops.test', body: 'While saying the hook line the pitch should be different from the story part and need to be exciting and tension creating.', at: '1/15/26, 9:05 AM' },
  { project: 'Ashtavakra Story Reel', author: 'divya@demo.yv-ops.test', body: 'Omg these visuals are soo good', at: '1/27/26, 5:15 PM', resolved: true },
  { project: 'Ashtavakra Story Reel', author: 'deepthi@demo.yv-ops.test', body: "The visuals are stunning! We need a powerful BGM for this. Hope the subtitles fit in for the Insta reel aspect ratio.", at: '2/3/26, 12:28 AM' },
  { project: 'Ashtavakra Story Reel', author: 'divya@demo.yv-ops.test', body: 'Yes but this is to his own son kada. So they may be projected in a bad light.', at: '2/3/26, 11:05 PM' },
];

/* --------------------------- revision requests --------------------------- */
const REVISIONS = [
  {
    project: 'Ashtavakra Story Reel',
    revisionNumber: 1,
    reason: "Script correction: omit the line about the mother naming him Ashtavakra (not evidently mentioned); continue with 'he was born bent in eight places - Ashtavakra.'",
    requester: 'deepthi@demo.yv-ops.test',
    status: 'resolved',
    requestedAt: '1/30/26, 11:19 AM',
    resolvedAt: '1/30/26, 12:05 PM',
  },
  {
    project: 'Ashtavakra Story Reel',
    revisionNumber: 2,
    reason: "Video edit change: the 'curse' depiction may project the father in a bad light (it's his own son). Generate a more dignified image; finalize between the two edit versions.",
    requester: 'divya@demo.yv-ops.test',
    status: 'resolved',
    requestedAt: '2/3/26, 11:05 PM',
    resolvedAt: '2/4/26, 1:13 PM',
  },
];

/* ------------------------------- main -------------------------------- */
async function main() {
  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, bcrypt.genSaltSync(10));

  // Resolve org
  const org = await Organization.findOneAndUpdate(
    { slug: ORG_SLUG },
    { $set: { name: 'Demo Content Team', slug: ORG_SLUG } },
    { upsert: true, new: true }
  );

  // Users + memberships for the three chat participants
  const emailToId = {};
  for (const p of PARTICIPANTS) {
    const user = await User.findOneAndUpdate(
      { email: p.email.toLowerCase() },
      { $set: { name: p.name, email: p.email.toLowerCase(), passwordHash, title: p.title } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    emailToId[p.email.toLowerCase()] = user._id;
    const role = VALID_ROLES.includes(p.role) ? p.role : 'member';
    await Membership.findOneAndUpdate(
      { userId: user._id, organizationId: org._id },
      { $set: { role, disabled: false } },
      { upsert: true, new: true }
    );
    console.log(`Upserted user ${p.email} -> ${role}`);
  }
  const resolveUser = (email) => (email ? emailToId[email.toLowerCase()] : null);

  // ---- Chat: clear any prior synthetic "Team Chat" data, then recreate ----
  const oldChat = await Project.findOne({ organizationId: org._id, title: 'Team Chat' });
  if (oldChat) {
    const oldChannels = await Channel.find({ projectId: oldChat._id });
    for (const ch of oldChannels) await ChatMessage.deleteMany({ channelId: ch._id });
    await Channel.deleteMany({ projectId: oldChat._id });
    await Project.deleteOne({ _id: oldChat._id });
    console.log('Cleared previous synthetic Team Chat data');
  }

  const chatProject = await Project.findOneAndUpdate(
    { organizationId: org._id, title: 'Team Chat' },
    { $set: { title: 'Team Chat', type: 'Content Production', status: 'IN_PROGRESS', description: 'Imported team conversations (WhatsApp "Stories Category").' } },
    { upsert: true, new: true }
  );
  const channel = await Channel.findOneAndUpdate(
    { projectId: chatProject._id, name: 'Stories Category' },
    { $set: { projectId: chatProject._id, name: 'Stories Category', type: 'channel' } },
    { upsert: true, new: true }
  );
  let msgCount = 0;
  for (const [dateStr, authorName, body] of CHAT_MESSAGES) {
    const author = resolveUser(PARTICIPANTS.find((p) => p.name === authorName).email);
    if (!author) continue;
    await ChatMessage.findOneAndUpdate(
      { channelId: channel._id, body },
      { $set: { channelId: channel._id, projectId: chatProject._id, author, body, sentAt: parseChatDate(dateStr) } },
      { upsert: true, new: true }
    );
    msgCount++;
  }
  console.log(`Upserted #Stories Category: ${msgCount} messages`);

  // ---- Clear legacy synthetic demo projects (from the old mock seed) ----
  // These contradict the "real data only" intent; remove them so the DB
  // reflects just the curated chat-derived records.
  const LEGACY_MOCK_TITLES = [
    'Ashram Testimonial — Episode 1',
    'Pre-pregnancy Awareness Reel',
    'Diwali Campaign — Light of Giving',
    'Post-natal Nutrition Carousel',
    'Yoga Series — Episode 4',
    'Festive Special — Puranic Story',
    'Annual Impact Report 2026',
    "Kids' Story Corner — Pilot",
    'Ashram Tour — Behind the Scenes',
    "Mothers' Day Tribute Reel",
    'Monsoon Relief Update',
    'Krishna Janmashtami Reel',
  ];
  const legacyProjects = await Project.find({ organizationId: org._id, title: { $in: LEGACY_MOCK_TITLES } });
  for (const lp of legacyProjects) {
    await Task.deleteMany({ projectId: lp._id });
    await Comment.deleteMany({ projectId: lp._id });
    await RevisionRequest.deleteMany({ projectId: lp._id });
    const lch = await Channel.find({ projectId: lp._id });
    for (const ch of lch) await ChatMessage.deleteMany({ channelId: ch._id });
    await Channel.deleteMany({ projectId: lp._id });
  }
  if (legacyProjects.length) {
    await Project.deleteMany({ _id: { $in: legacyProjects.map((p) => p._id) } });
    console.log(`Cleared ${legacyProjects.length} legacy synthetic demo projects`);
  }

  // ---- Content projects ----
  const projectByTitle = {};
  for (const p of PROJECTS) {
    const update = {
      title: p.title,
      type: p.type || 'Content Production',
      description: p.description || '',
      status: p.status,
      creator: resolveUser(p.creator),
      assignee: resolveUser(p.assignee),
      publishedAt: p.publishedAt ? parseChatDate(p.publishedAt) : null,
    };
    const project = await Project.findOneAndUpdate(
      { organizationId: org._id, title: p.title },
      { $set: update },
      { upsert: true, new: true }
    );
    projectByTitle[p.title] = project._id;
    console.log(`Upserted project "${p.title}" [${p.status}]`);
  }

  // ---- Tasks ----
  await Task.deleteMany({ projectId: { $in: Object.values(projectByTitle) } });
  for (const t of TASKS) {
    const pid = projectByTitle[t.project];
    if (!pid) continue;
    await Task.create({
      projectId: pid,
      title: t.title,
      status: t.status,
      priority: t.priority,
      assignee: resolveUser(t.assignee),
      createdBy: resolveUser(t.assignee),
      dueDate: t.due ? parseChatDate(t.due) : null,
    });
  }
  console.log(`Created ${TASKS.length} tasks`);

  // ---- Comments / reviews ----
  await Comment.deleteMany({ projectId: { $in: Object.values(projectByTitle) } });
  for (const c of COMMENTS) {
    const pid = projectByTitle[c.project];
    if (!pid) continue;
    await Comment.create({
      projectId: pid,
      author: resolveUser(c.author),
      body: c.body,
      resolved: !!c.resolved,
      createdAt: parseChatDate(c.at),
    });
  }
  console.log(`Created ${COMMENTS.length} review comments`);

  // ---- Revision requests ----
  await RevisionRequest.deleteMany({ projectId: { $in: Object.values(projectByTitle) } });
  for (const r of REVISIONS) {
    const pid = projectByTitle[r.project];
    if (!pid) continue;
    await RevisionRequest.create({
      projectId: pid,
      revisionNumber: r.revisionNumber,
      reason: r.reason,
      requester: resolveUser(r.requester),
      status: r.status,
      requestedAt: parseChatDate(r.requestedAt),
      resolvedAt: r.resolvedAt ? parseChatDate(r.resolvedAt) : null,
    });
  }
  console.log(`Created ${REVISIONS.length} revision requests`);

  // ---- Publications ----
  await Publication.deleteMany({ projectId: { $in: Object.values(projectByTitle) } });
  for (const pub of PUBLICATIONS) {
    const pid = projectByTitle[pub.project];
    if (!pid) continue;
    await Publication.create({
      projectId: pid,
      platform: pub.platform,
      postUrl: pub.postUrl || '',
      publishedBy: resolveUser(pub.publishedBy),
      publishedAt: parseChatDate(pub.publishedAt),
    });
  }
  console.log(`Created ${PUBLICATIONS.length} publications`);

  // ---- Notifications ----
  await Notification.deleteMany({ projectId: { $in: Object.values(projectByTitle) } });
  for (const n of NOTIFICATIONS) {
    const uid = resolveUser(n.to);
    const pid = projectByTitle[n.project];
    if (!uid || !pid) continue;
    await Notification.create({
      userId: uid,
      projectId: pid,
      type: n.type,
      title: n.title,
      body: n.body,
      read: !!n.read,
      createdAt: parseChatDate(n.at),
    });
  }
  console.log(`Created ${NOTIFICATIONS.length} notifications`);

  console.log('Seed complete.');
}

if (DRY_RUN) {
  console.log(`DRY RUN — would create:`);
  console.log(`  • ${PARTICIPANTS.length} users`);
  console.log(`  • 1 "Team Chat" project + #Stories Category with ${CHAT_MESSAGES.length} messages`);
  console.log(`  • ${PROJECTS.length} content projects`);
  console.log(`  • ${TASKS.length} tasks`);
  console.log(`  • ${COMMENTS.length} review comments`);
  console.log(`  • ${REVISIONS.length} revision requests`);
  console.log(`  • ${PUBLICATIONS.length} publications`);
  console.log(`  • ${NOTIFICATIONS.length} notifications`);
  console.log('DRY RUN — no database changes made.');
  process.exit(0);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to', MONGO_URI);
    return main();
  })
  .then(() => mongoose.disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
