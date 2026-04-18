# Lucky 7 HQ — Page Source

Copy everything inside the code block below and paste into the Base44 editor for the Lucky7 page.

```jsx
import React, { useState, useEffect } from 'react';
import { StrategyDecision, Task, Deadline, IdeaParkingLot, OutreachContact, HabitLog } from '@/api/entities';

const PIECES = [
  { emoji: '⭐', title: 'Continuous Growth', subtitle: 'Open Mindset & Curiosity', color: 'from-yellow-400 to-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'Stay open. Feed your brain daily with what excites you. Your North Star.', automation: 'Daily Curiosity Feed', type: 'star' },
  { emoji: '❤️', title: 'Self-Compassion', subtitle: 'Start Imperfectly', color: 'from-rose-400 to-pink-500', bg: 'bg-rose-50', border: 'border-rose-200', desc: 'Done beats perfect. Start before ready. Never miss twice — but forgive the first.', automation: 'Built into every check-in', type: 'heart' },
  { emoji: '💡', num: 1, title: 'Idea Parking Lot', subtitle: 'Capture everything, judge nothing', color: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50', border: 'border-blue-200', desc: 'Every spark goes here immediately. No filtering at capture time — just park it.', automation: 'Always open' },
  { emoji: '⚡', num: 2, title: 'Micro-Task Engine', subtitle: 'Break it down, make it doable', color: 'from-violet-400 to-purple-500', bg: 'bg-violet-50', border: 'border-violet-200', desc: 'Any overwhelming task gets broken into 15-min micro-steps. Small wins build momentum.', automation: 'Morning Check-in' },
  { emoji: '🌅', num: 3, title: 'Daily Focus Rhythm', subtitle: 'Morning intention, evening reflection', color: 'from-orange-400 to-rose-400', bg: 'bg-orange-50', border: 'border-orange-200', desc: 'Set one clear focus in the morning. Reflect on what moved in the evening.', automation: 'Morning 8:15am + Evening 9:30pm CT' },
  { emoji: '⏰', num: 4, title: 'Deadline Tracker', subtitle: 'Nothing slips, everything visible', color: 'from-red-400 to-rose-500', bg: 'bg-red-50', border: 'border-red-200', desc: 'Every commitment lives here. Daily watchdog alerts if anything is due in 7 days.', automation: 'Deadline Watchdog — daily 8am CT' },
  { emoji: '🤝', num: 5, title: 'Accountability Check-ins', subtitle: 'Honest scoreboard, no hiding', color: 'from-teal-400 to-cyan-500', bg: 'bg-teal-50', border: 'border-teal-200', desc: 'WhatsApp nudges every morning and evening. No hiding from the scoreboard.', automation: 'WhatsApp — weekdays + Saturday' },
  { emoji: '🏆', num: 6, title: 'Minute Wins + Habit Stack', subtitle: 'Small daily victories compound', color: 'from-green-400 to-emerald-500', bg: 'bg-green-50', border: 'border-green-200', desc: 'Log one win daily — no matter how small. Habits compound. Streaks build identity.', automation: 'Evening check-in' },
  { emoji: '🪞', num: 7, title: 'Daily Reflection', subtitle: 'End-of-day recalibration', color: 'from-indigo-400 to-blue-500', bg: 'bg-indigo-50', border: 'border-indigo-200', desc: 'What moved? What did I avoid? What do I carry into tomorrow? Course correct daily.', automation: 'Evening Wind-down 9:30pm CT' },
  { emoji: '🔭', title: 'Weekly Ops Review', subtitle: 'Zoom out, bigger picture', color: 'from-slate-400 to-gray-500', bg: 'bg-slate-50', border: 'border-slate-200', desc: "Every Sunday — wins, what didn't work, top 3 priorities next week. Business + life.", automation: 'Sunday 7pm CT', type: 'bonus' },
];

const AUTOMATIONS = [
  { emoji: '🌅', name: 'Morning Check-in', schedule: 'Weekdays 8:15am CT', desc: 'Daily intention + top task focus' },
  { emoji: '🌙', name: 'Evening Wind-down', schedule: 'Weekdays 9:30pm CT', desc: 'Reflection + habit log + wins' },
  { emoji: '📅', name: 'Weekend Check-in', schedule: 'Saturday 8:30am CT', desc: 'Weekly focus + Saturday plan' },
  { emoji: '⏰', name: 'Deadline Watchdog', schedule: 'Daily 8am CT', desc: 'Alerts for anything due in 7 days' },
  { emoji: '🔭', name: 'Weekly Ops Review', schedule: 'Sunday 7pm CT', desc: 'Full business + life review prompt' },
  { emoji: '🤝', name: 'Weekly Accountability', schedule: 'Sunday 8am CT', desc: 'Honest scorecard of the week' },
  { emoji: '📧', name: 'Gmail Batch Summary', schedule: 'Every 6 hours', desc: 'Inbox intelligence digest' },
];

const DECISION_COLORS = { '✅ Approved': 'bg-green-100 text-green-700 border-green-200', '⏸️ Parked': 'bg-yellow-100 text-yellow-700 border-yellow-200', '❌ Rejected': 'bg-red-100 text-red-700 border-red-200', '🔄 Revisit': 'bg-blue-100 text-blue-700 border-blue-200', '💬 Discussing': 'bg-purple-100 text-purple-700 border-purple-200' };
const BRAND_COLORS = { 'Wormspire': 'bg-emerald-50 border-emerald-200 text-emerald-700', 'Puzzle4Life': 'bg-indigo-50 border-indigo-200 text-indigo-700', 'GreenSprout Hub': 'bg-green-50 border-green-200 text-green-700', 'uvprint.io': 'bg-violet-50 border-violet-200 text-violet-700', 'Personal': 'bg-gray-50 border-gray-200 text-gray-700' };
const PRIORITY_COLORS = { 'Urgent': 'bg-red-100 text-red-600 border-red-200', 'High': 'bg-orange-100 text-orange-600 border-orange-200', 'Medium': 'bg-yellow-100 text-yellow-600 border-yellow-200', 'Low': 'bg-gray-100 text-gray-500 border-gray-200' };
const STATUS_COLORS = { 'To Do': 'bg-gray-100 text-gray-600', 'In Progress': 'bg-blue-100 text-blue-600', 'Backlog': 'bg-slate-100 text-slate-500', 'Done': 'bg-green-100 text-green-600', 'Blocked': 'bg-red-100 text-red-500' };
const OUTREACH_STATUS_COLORS = { 'Not Contacted': 'bg-gray-100 text-gray-500', 'Email Drafted': 'bg-yellow-100 text-yellow-600', 'Contacted': 'bg-blue-100 text-blue-600', 'Replied': 'bg-indigo-100 text-indigo-600', 'In Discussion': 'bg-purple-100 text-purple-600', 'Partnered': 'bg-green-100 text-green-700', 'Pass': 'bg-red-100 text-red-400' };

function Pill({ label, active, onClick, activeColor = 'bg-green-600 text-white' }) {
  return (
    <button onClick={onClick} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${active ? `${activeColor} border-transparent shadow-sm` : 'bg-white text-gray-500 border-gray-200'}`}>
      {label}
    </button>
  );
}

function StatBox({ emoji, label, value, sub, color, onClick }) {
  return (
    <button onClick={onClick} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center w-full hover:shadow-md hover:border-green-200 transition-all active:scale-95">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs font-semibold text-gray-600 mt-0.5 leading-tight">{emoji} {label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </button>
  );
}

function HexCard({ piece }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} className={`rounded-2xl border ${piece.border} ${piece.bg} p-4 cursor-pointer transition-all hover:shadow-md select-none`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-2xl">{piece.emoji}</span>
        {piece.num && <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${piece.color} text-white`}>#{piece.num}</span>}
        {piece.type === 'star' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400 text-white">NORTH STAR</span>}
        {piece.type === 'heart' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-400 text-white">CORE</span>}
        {piece.type === 'bonus' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-400 text-white">WEEKLY</span>}
      </div>
      <h3 className="font-bold text-gray-800 text-sm">{piece.title}</h3>
      <p className="text-xs text-gray-500 mt-0.5">{piece.subtitle}</p>
      {open && <div className="mt-3 pt-3 border-t border-gray-200"><p className="text-xs text-gray-600 mb-2">{piece.desc}</p><p className="text-xs text-indigo-500 font-medium">⚡ {piece.automation}</p></div>}
    </div>
  );
}

function TaskCard({ t, onToggleDone }) {
  const daysLeft = t.due_date ? Math.ceil((new Date(t.due_date) - new Date()) / 86400000) : null;
  const overdue = daysLeft !== null && daysLeft < 0 && t.status !== 'Done';
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 ${t.status === 'Done' ? 'opacity-40' : ''} ${overdue ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => onToggleDone(t)} className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${t.status === 'Done' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'}`}>
          {t.status === 'Done' && <span className="text-xs">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {t.priority && <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${PRIORITY_COLORS[t.priority] || 'bg-gray-100'}`}>{t.priority}</span>}
            {t.category && <span className="text-xs text-gray-400">{t.category}</span>}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ml-auto ${STATUS_COLORS[t.status] || 'bg-gray-100'}`}>{t.status}</span>
          </div>
          <h3 className={`font-semibold text-sm leading-snug ${t.status === 'Done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</h3>
          {t.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</p>}
          {t.due_date && <p className={`text-xs mt-1 font-medium ${overdue ? 'text-red-500' : daysLeft <= 2 ? 'text-orange-500' : 'text-gray-400'}`}>
            {overdue ? `⚠️ ${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? '🔥 Due today' : `📅 ${daysLeft}d left`}
          </p>}
        </div>
      </div>
    </div>
  );
}

function DecisionCard({ d }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${DECISION_COLORS[d.decision] || 'bg-gray-100 text-gray-600'}`}>{d.decision || 'Pending'}</span>
              {d.brand && <span className={`text-xs px-2 py-0.5 rounded-full border ${BRAND_COLORS[d.brand] || 'bg-gray-100'}`}>{d.brand}</span>}
              {d.investment && <span className="text-xs text-gray-400 font-medium">{d.investment}</span>}
            </div>
            <h3 className="font-semibold text-gray-800 text-sm leading-snug">{d.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{d.date}{d.revisit_date ? ` · revisit ${d.revisit_date}` : ''}</p>
          </div>
          <span className="text-gray-300 text-xs mt-1">{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-2">
          {d.context && <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Context</p><p className="text-xs text-gray-600">{d.context}</p></div>}
          {d.yoda_recommendation && <div><p className="text-xs font-semibold text-indigo-500 mb-0.5">🎋 Yoda's Take</p><p className="text-xs text-gray-600">{d.yoda_recommendation}</p></div>}
          {d.reasoning && <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Why</p><p className="text-xs text-gray-600">{d.reasoning}</p></div>}
          {d.outcome && <div><p className="text-xs font-semibold text-green-600 mb-0.5">Outcome</p><p className="text-xs text-gray-600">{d.outcome}</p></div>}
        </div>
      )}
    </div>
  );
}

function OutreachCard({ c }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${OUTREACH_STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
              {c.brand_fit && <span className={`text-xs px-2 py-0.5 rounded-full border ${BRAND_COLORS[c.brand_fit] || 'bg-gray-100'}`}>{c.brand_fit}</span>}
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">{c.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{c.organization}{c.location ? ` · ${c.location}` : ''}</p>
            {c.followers && <p className="text-xs text-indigo-400 mt-0.5">👥 {c.followers}</p>}
          </div>
          <span className="text-gray-300 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-2">
          {c.why_relevant && <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Why</p><p className="text-xs text-gray-600">{c.why_relevant}</p></div>}
          {c.collab_idea && <div><p className="text-xs font-semibold text-indigo-500 mb-0.5">💡 Collab Idea</p><p className="text-xs text-gray-600">{c.collab_idea}</p></div>}
          <div className="flex flex-wrap gap-2 pt-1">
            {c.email && <a href={`mailto:${c.email}`} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">✉️ Email</a>}
            {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-lg">🌐 Website</a>}
            {c.instagram && <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-lg">📸 {c.instagram}</span>}
          </div>
          {c.notes && <p className="text-xs text-gray-400 italic mt-1">{c.notes}</p>}
        </div>
      )}
    </div>
  );
}

export default function Lucky7() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks]         = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [ideas, setIdeas]         = useState([]);
  const [habits, setHabits]       = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [contacts, setContacts]   = useState([]);
  const [loading, setLoading]     = useState(true);

  const [taskStatus,   setTaskStatus]   = useState('Active');
  const [taskPriority, setTaskPriority] = useState('All');
  const [taskCategory, setTaskCategory] = useState('All');
  const [decBrand,  setDecBrand]  = useState('All');
  const [decStatus, setDecStatus] = useState('All');
  const [outBrand,  setOutBrand]  = useState('All');
  const [outStatus, setOutStatus] = useState('All');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [t, d, i, h, dec, c] = await Promise.all([
        Task.list(), Deadline.list(), IdeaParkingLot.list(),
        HabitLog.list(), StrategyDecision.list(), OutreachContact.list(),
      ]);
      setTasks(t);
      setDeadlines(d);
      setIdeas(i);
      setHabits(h);
      setDecisions(dec.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setContacts(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleDone = async (t) => {
    const s = t.status === 'Done' ? 'To Do' : 'Done';
    await Task.update(t.id, { status: s });
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: s } : x));
  };

  const urgentTasks     = tasks.filter(t => (t.priority === 'Urgent' || t.priority === 'High') && t.status !== 'Done');
  const activeTasks     = tasks.filter(t => t.status !== 'Done');
  const urgentDeadlines = deadlines.filter(d => d.status !== 'Done' && d.due_date && Math.ceil((new Date(d.due_date) - new Date()) / 86400000) <= 7);
  const activeIdeas     = ideas.filter(i => i.status !== 'Archived' && i.status !== 'Done');
  const revisitSoon     = decisions.filter(d => d.revisit_date && Math.ceil((new Date(d.revisit_date) - new Date()) / 86400000) <= 14);
  const approvedDec     = decisions.filter(d => d.decision === '✅ Approved');
  const taskCategories  = ['All', ...new Set(tasks.map(t => t.category).filter(Boolean))];
  const pendingContacts = contacts.filter(c => c.status === 'Not Contacted').length;

  const filteredTasks = tasks.filter(t => {
    if (taskStatus === 'Active' && t.status === 'Done') return false;
    if (taskStatus === 'Done' && t.status !== 'Done') return false;
    if (taskCategory !== 'All' && t.category !== taskCategory) return false;
    if (taskPriority !== 'All' && t.priority !== taskPriority) return false;
    return true;
  }).sort((a, b) => {
    if (a.status === 'Done' && b.status !== 'Done') return 1;
    if (a.status !== 'Done' && b.status === 'Done') return -1;
    return ({ Urgent:0, High:1, Medium:2, Low:3 }[a.priority] ?? 4) - ({ Urgent:0, High:1, Medium:2, Low:3 }[b.priority] ?? 4);
  });

  const filteredDecisions = decisions.filter(d => (decBrand === 'All' || d.brand === decBrand) && (decStatus === 'All' || d.decision === decStatus));
  const filteredContacts  = contacts.filter(c => (outBrand === 'All' || c.brand_fit === outBrand) && (outStatus === 'All' || c.status === outStatus));

  const TABS = [
    { key: 'tasks',       label: '⚡ Tasks',     count: urgentTasks.length },
    { key: 'decisions',   label: '🎋 Decisions',  count: revisitSoon.length },
    { key: 'deadlines',   label: '⏰ Deadlines',  count: urgentDeadlines.length },
    { key: 'outreach',    label: '🤝 Outreach',   count: pendingContacts },
    { key: 'ideas',       label: '💡 Ideas',      count: activeIdeas.length },
    { key: 'habits',      label: '🏆 Habits' },
    { key: 'system',      label: '🧩 System' },
    { key: 'automations', label: '⚙️ Auto' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-indigo-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">🌱 Lucky 7 HQ</h1>
              <p className="text-xs text-gray-400">Baris · GreenSprout Hub Command Center</p>
            </div>
            <a href="https://yoda.base44.app" target="_blank" rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
              💬 Yoda
            </a>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <StatBox emoji="🔥" label="Urgent"    value={urgentTasks.length}     sub={`${activeTasks.length} active`}  color="text-red-500"    onClick={() => { setActiveTab('tasks'); setTaskPriority('Urgent'); }} />
            <StatBox emoji="🎋" label="Decisions" value={decisions.length}        sub={`${approvedDec.length} ✅`}       color="text-green-600"  onClick={() => setActiveTab('decisions')} />
            <StatBox emoji="⏰" label="Deadlines" value={urgentDeadlines.length}  sub="due ≤7 days"                    color="text-orange-500" onClick={() => setActiveTab('deadlines')} />
            <StatBox emoji="🤝" label="Outreach"  value={contacts.length}         sub={`${pendingContacts} pending`}   color="text-indigo-500" onClick={() => setActiveTab('outreach')} />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.key ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${
                    activeTab === tab.key ? 'bg-white text-green-700' : 'bg-red-500 text-white'
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">

        {activeTab === 'tasks' && (
          <div>
            <div className="space-y-2 mb-4">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{scrollbarWidth:'none'}}>
                {['Active','Done','All'].map(s => <Pill key={s} label={s} active={taskStatus===s} onClick={() => setTaskStatus(s)} />)}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{scrollbarWidth:'none'}}>
                {['All','Urgent','High','Medium','Low'].map(p => (
                  <Pill key={p} label={p} active={taskPriority===p} onClick={() => setTaskPriority(p)}
                    activeColor={p==='Urgent'?'bg-red-500 text-white':p==='High'?'bg-orange-500 text-white':'bg-green-600 text-white'} />
                ))}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{scrollbarWidth:'none'}}>
                {taskCategories.map(c => <Pill key={c} label={c} active={taskCategory===c} onClick={() => setTaskCategory(c)} activeColor="bg-indigo-600 text-white" />)}
              </div>
            </div>
            {loading ? <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
              : filteredTasks.length === 0 ? <p className="text-center text-gray-400 text-sm py-8">No tasks match 🎉</p>
              : <div className="space-y-2.5">{filteredTasks.map(t => <TaskCard key={t.id} t={t} onToggleDone={toggleDone} />)}</div>}
          </div>
        )}

        {activeTab === 'decisions' && (
          <div>
            {revisitSoon.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <p className="text-xs font-bold text-amber-700 mb-1">🔄 Revisit Soon ({revisitSoon.length})</p>
                {revisitSoon.map(d => <p key={d.id} className="text-xs text-amber-600">· {d.title} — {d.revisit_date}</p>)}
              </div>
            )}
            <div className="space-y-2 mb-4">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{scrollbarWidth:'none'}}>
                {['All','Wormspire','Puzzle4Life','GreenSprout Hub','Personal'].map(b => <Pill key={b} label={b} active={decBrand===b} onClick={() => setDecBrand(b)} />)}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{scrollbarWidth:'none'}}>
                {['All','✅ Approved','⏸️ Parked','🔄 Revisit','❌ Rejected','💬 Discussing'].map(s => (
                  <Pill key={s} label={s} active={decStatus===s} onClick={() => setDecStatus(s)} activeColor="bg-indigo-600 text-white" />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {loading ? <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
                : filteredDecisions.length === 0 ? <p className="text-center text-gray-400 text-sm py-8">No decisions match</p>
                : filteredDecisions.map(d => <DecisionCard key={d.id} d={d} />)}
            </div>
          </div>
        )}

        {activeTab === 'deadlines' && (
          <div className="space-y-3">
            {deadlines.filter(d => d.status !== 'Done').length === 0
              ? <p className="text-center text-gray-400 text-sm py-8">No open deadlines 🎉</p>
              : deadlines.filter(d => d.status !== 'Done').sort((a,b) => new Date(a.due_date)-new Date(b.due_date)).map(d => {
                  const days = d.due_date ? Math.ceil((new Date(d.due_date)-new Date())/86400000) : null;
                  return (
                    <div key={d.id} className={`bg-white rounded-xl border shadow-sm p-4 ${days<=0?'border-red-300':days<=3?'border-orange-200':days<=7?'border-yellow-200':'border-gray-100'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-800 text-sm">{d.title}</h3>
                          {d.due_date && <p className={`text-xs font-semibold mt-0.5 ${days<=0?'text-red-500':days<=3?'text-orange-500':days<=7?'text-yellow-600':'text-gray-400'}`}>
                            {days<0?`⚠️ ${Math.abs(days)}d overdue`:days===0?'🔥 Due TODAY':`${days} days · ${d.due_date}`}
                          </p>}
                          {d.description && <p className="text-xs text-gray-500 mt-1">{d.description}</p>}
                          {d.consequence && <p className="text-xs text-red-400 mt-1 italic">⚡ {d.consequence}</p>}
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full whitespace-nowrap">{d.category}</span>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}

        {activeTab === 'outreach' && (
          <div>
            <div className="space-y-2 mb-4">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{scrollbarWidth:'none'}}>
                {['All','Wormspire','Puzzle4Life','GreenSprout Hub'].map(b => <Pill key={b} label={b} active={outBrand===b} onClick={() => setOutBrand(b)} />)}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{scrollbarWidth:'none'}}>
                {['All','Not Contacted','Contacted','Replied','In Discussion','Partnered'].map(s => (
                  <Pill key={s} label={s} active={outStatus===s} onClick={() => setOutStatus(s)} activeColor="bg-indigo-600 text-white" />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {loading ? <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
                : filteredContacts.length === 0 ? <p className="text-center text-gray-400 text-sm py-8">No contacts match</p>
                : filteredContacts.map(c => <OutreachCard key={c.id} c={c} />)}
            </div>
          </div>
        )}

        {activeTab === 'ideas' && (
          <div className="space-y-3">
            {activeIdeas.length === 0 ? <p className="text-center text-gray-400 text-sm py-8">Idea lot is empty!</p>
              : activeIdeas.sort((a,b) => ({High:0,Medium:1,Low:2}[a.priority]??3)-({High:0,Medium:1,Low:2}[b.priority]??3)).map(i => (
                <div key={i.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {i.priority && <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${PRIORITY_COLORS[i.priority]||'bg-gray-100 text-gray-500'}`}>{i.priority}</span>}
                        {i.category && <span className="text-xs text-gray-400">{i.category}</span>}
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm">{i.title}</h3>
                      {i.description && <p className="text-xs text-gray-500 mt-1 line-clamp-3">{i.description}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[i.status]||'bg-gray-100 text-gray-500'}`}>{i.status}</span>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === 'habits' && (
          <div>
            {habits.length === 0
              ? <div className="text-center py-12"><p className="text-4xl mb-3">🏆</p><p className="text-sm text-gray-500">No habit logs yet.</p><p className="text-xs text-gray-400 mt-1">Your evening check-in logs habits automatically.</p></div>
              : <div className="space-y-3">{habits.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,10).map(h=>(
                  <div key={h.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-800 text-sm">{h.date}</p>
                      <div className="flex items-center gap-1">
                        {h.mood && <span className="text-lg">{h.mood}</span>}
                        {h.focus_score && <span className="text-xs text-indigo-500 font-semibold">Focus {h.focus_score}/10</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[{key:'meditation',label:'🧘'},{key:'fitness',label:'💪'},{key:'dog_walk',label:'🐕'},{key:'healthy_eating',label:'🥗'},{key:'minute_win',label:'🏆'}].map(hb=>(
                        <span key={hb.key} className={`text-xs px-2 py-0.5 rounded-full ${h[hb.key]?'bg-green-100 text-green-700':'bg-gray-100 text-gray-400'}`}>{hb.label} {h[hb.key]?'✓':'✗'}</span>
                      ))}
                    </div>
                    {h.minute_win_description && <p className="text-xs text-green-600 mt-2 italic">🏆 {h.minute_win_description}</p>}
                    {h.notes && <p className="text-xs text-gray-400 mt-1">{h.notes}</p>}
                  </div>
                ))}</div>
            }
          </div>
        )}

        {activeTab === 'system' && (
          <div>
            <p className="text-sm text-gray-500 mb-4 text-center italic">"Built by a neurodivergent solopreneur who needed a system that actually worked."</p>
            <div className="grid grid-cols-2 gap-3 mb-3">{PIECES.filter(p=>p.type==='star'||p.type==='heart').map(p=><HexCard key={p.title} piece={p}/>)}</div>
            <div className="grid grid-cols-2 gap-3 mb-3">{PIECES.filter(p=>p.num).map(p=><HexCard key={p.title} piece={p}/>)}</div>
            {PIECES.filter(p=>p.type==='bonus').map(p=><HexCard key={p.title} piece={p}/>)}
          </div>
        )}

        {activeTab === 'automations' && (
          <div className="space-y-3">
            {AUTOMATIONS.map(a=>(
              <div key={a.name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{a.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">{a.name}</h3>
                    <p className="text-xs text-green-600 font-medium mt-0.5">⏰ {a.schedule}</p>
                    <p className="text-xs text-gray-500 mt-1">{a.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
```
