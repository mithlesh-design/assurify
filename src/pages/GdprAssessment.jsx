import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import ControlPanel from '../components/ControlPanel';
import { gdprInitialControls, GDPR_PRINCIPLES } from '../data/gdprControls';
import { STATUS_META, statusLabel, statusClass } from '../data/controls';
import { EmptyState, FilterChips, Icons, Progress } from '../ui';

const FILTERS = ['all', ...STATUS_META.map(status => status.value)];
const STATUS_COLORS = {
  pending_review: '#94A3B8', in_progress: '#3B82F6', implemented: '#10B981',
  needs_discussion: '#F59E0B', blocked: '#EF4444', not_applicable: '#8B5CF6',
};

export default function GdprAssessment() {
  const { user } = useApp();
  const [controls, setControls] = useState(() => gdprInitialControls.map(control => ({ ...control, docs: [], acts: [] })));
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState(null);
  const counts = useMemo(() => Object.fromEntries([
    ['all', controls.length], ...STATUS_META.map(status => [status.value, controls.filter(control => control.status === status.value).length]),
  ]), [controls]);
  const groups = useMemo(() => GDPR_PRINCIPLES.map(principle => {
    const all = controls.filter(control => control.principle === principle);
    const shown = filter === 'all' ? all : all.filter(control => control.status === filter);
    const complete = all.filter(control => ['implemented', 'not_applicable'].includes(control.status)).length;
    return { principle, all, shown, complete, percent: all.length ? Math.round(complete / all.length * 100) : 0 };
  }).filter(group => group.shown.length), [controls, filter]);
  const complete = controls.filter(control => ['implemented', 'not_applicable'].includes(control.status)).length;
  const score = controls.length ? Math.round(complete / controls.length * 100) : 0;
  const selected = controls.find(control => control.id === openId);

  const addComment = (id, message) => setControls(current => current.map(control => control.id !== id ? control : {
    ...control,
    acts: [...control.acts, { id: `gdpr-${Date.now()}`, type: 'comment', user: user?.name ?? 'User', role: 'customer', at: new Date().toISOString(), msg: message }],
  }));

  return <div className="page">
    <p className="page-lead">
      Review GDPR obligations by principle. Select a control to view its assessment criteria, discuss it, or add a note. Progress and comments are currently held in this session.
    </p>
    <div className="tile-grid" style={{ marginBottom: 24 }}>
      <div className="stat-tile"><div className="stat-tile-label">Overall score</div><div className={`stat-tile-value ${score < 40 ? 'danger' : score < 70 ? 'warn' : 'ok'}`}>{score}%</div><div className="stat-tile-meta">{complete}/{controls.length} controls complete</div></div>
      <div className="stat-tile"><div className="stat-tile-label">GDPR principles</div><div className="stat-tile-value">{GDPR_PRINCIPLES.length}</div><div className="stat-tile-meta">{groups.length} with visible controls</div></div>
      <div className="stat-tile"><div className="stat-tile-label">Needs your input</div><div className="stat-tile-value warn">{controls.filter(control => ['needs_discussion', 'blocked'].includes(control.status)).length}</div><div className="stat-tile-meta">blocked or needs discussion</div></div>
      <div className="stat-tile"><div className="stat-tile-label">GDPR obligations</div><div className="stat-tile-value">{controls.length}</div><div className="stat-tile-meta">Article and recital references included</div></div>
    </div>
    <div style={{ marginBottom: 20 }}>
      <FilterChips
        label="Filter controls by status"
        value={filter}
        onChange={setFilter}
        items={FILTERS.map(value => ({
          key: value,
          label: value === 'all' ? 'All' : STATUS_META.find(status => status.value === value)?.label ?? value,
          dot: value === 'all' ? null : STATUS_COLORS[value],
          count: counts[value] ?? 0,
        }))}
      />
    </div>
    {groups.map(({ principle, all, shown, complete: groupComplete, percent }) => {
      const tone = percent >= 70 ? 'low' : percent >= 30 ? 'med' : 'high';
      return <section key={principle} style={{ marginBottom: 28 }}>
        <div className="assess-group-head">
          <h2 className="assess-obl-name" style={{ flex: 1, margin: 0 }}>{principle}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 80 }}><Progress value={percent} tone={tone} /></div><span style={{ fontSize: 12, fontWeight: 700, minWidth: 44, textAlign: 'right' }}>{groupComplete}/{all.length}</span></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shown.map(control => <button key={control.id} className="ctrl-list-item" onClick={() => setOpenId(control.id)}>
            <div className="status-bar" style={{ background: STATUS_COLORS[control.status] ?? 'var(--muted)' }} />
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}><div className="ctrl-item-name">{control.obligation}. {control.name}</div><div className="ctrl-item-desc">{control.req} · {control.desc}</div></div>
            <div className="ctrl-item-meta"><span className={`status-badge ${statusClass(control.status)}`}>{statusLabel(control.status)}</span><span className="ctrl-arrow"><Icons.ChevronRight size={15} /></span></div>
          </button>)}
        </div>
      </section>;
    })}
    {!groups.length && <EmptyState compact icon={<Icons.Shield size={20} />} title="No controls match this filter" description="Choose another status to see more controls." />}
    {selected && <ControlPanel ctrl={{ ...selected, oblLabel: selected.principle }} onClose={() => setOpenId(null)} staticMode onStaticComment={addComment} />}
  </div>;
}
