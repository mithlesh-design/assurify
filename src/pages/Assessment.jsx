import { useState, useMemo } from 'react';
import { useApp }                from '../context/AppContext';
import { GAPP_PRINCIPLE_LABELS } from '../config/obligations';
import { OBL_META, STATUS_META, statusLabel, statusClass } from '../data/controls';
import { Progress } from '../ui';
import ControlPanel from '../components/ControlPanel';

const FILTER_ORDER = ['all', ...STATUS_META.map(s => s.value)];

const STATUS_BAR_COLOR = {
  pending_review:   '#94A3B8',
  in_progress:      '#3B82F6',
  implemented:      '#10B981',
  needs_discussion: '#F59E0B',
  blocked:          '#EF4444',
  not_applicable:   '#8B5CF6',
};

/* ── SVG icons ────────────────────────────────────────── */
const IcoShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcoFile = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);
const IcoChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

/* ── Stat tile (icon + left-border accent) ────────────── */
function StatTile({ icon: Icon, label, value, sub, color, accent }) {
  return (
    <div className="stat-tile" style={{ borderLeft: `3px solid ${accent}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', right: 14, top: 14, opacity: 0.08,
        color: accent, transform: 'scale(2)', transformOrigin: 'top right',
      }}>
        <Icon />
      </div>
      <div style={{
        width: 30, height: 30, borderRadius: 7,
        background: `${accent}18`, color: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 10,
      }}>
        <Icon />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)',
        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: color ?? 'var(--ink)', lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--slate)' }}>{sub}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Assessment Page
═══════════════════════════════════════════════════════ */
function AssessmentPage() {
  const { controls, controlsLoading, controlsError } = useApp();
  const [filter,   setFilter]   = useState('all');
  const [openCtrl, setOpenCtrl] = useState(null);

  const oblMeta = useMemo(() => {
    const seen = new Set();
    const result = [];
    controls.forEach(c => {
      if (c.obl && !seen.has(c.obl)) {
        seen.add(c.obl);
        result.push({
          id:   c.obl,
          name: GAPP_PRINCIPLE_LABELS[c.obl]
                ?? OBL_META.find(o => o.id === c.obl)?.name
                ?? c.obl.replace(/_/g, ' '),
        });
      }
    });
    return result;
  }, [controls]);

  const counts = useMemo(() => {
    const c = { all: controls.length };
    STATUS_META.forEach(s => { c[s.value] = controls.filter(x => x.status === s.value).length; });
    return c;
  }, [controls]);

  const grouped = useMemo(() => {
    return oblMeta.map(obl => {
      const all   = controls.filter(c => c.obl === obl.id);
      const shown = filter === 'all' ? all : all.filter(c => c.status === filter);
      const impl  = all.filter(c => c.status === 'implemented' || c.status === 'not_applicable').length;
      const pct   = all.length > 0 ? Math.round((impl / all.length) * 100) : 0;
      const tone  = pct >= 70 ? 'low' : pct >= 30 ? 'med' : 'high';
      return { obl, all, shown, impl, pct, tone };
    }).filter(g => g.shown.length > 0);
  }, [controls, filter, oblMeta]);

  const score = useMemo(() => {
    if (!controls.length) return 0;
    const done = controls.filter(c => c.status === 'implemented' || c.status === 'not_applicable').length;
    return Math.round((done / controls.length) * 100);
  }, [controls]);

  const principlesMet = oblMeta.filter(o => {
    const cs = controls.filter(c => c.obl === o.id);
    return cs.length > 0 && cs.every(c => c.status === 'implemented' || c.status === 'not_applicable');
  }).length;

  const criticalGaps = oblMeta.filter(o =>
    controls.filter(c => c.obl === o.id).every(c => c.status === 'pending_review')
  ).length;

  const scoreAccent = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  const scoreColor  = score >= 70 ? 'var(--green-dim)' : score >= 40 ? '#B45309' : '#DC2626';

  const openCtrlData = openCtrl ? controls.find(c => c.id === openCtrl) : null;

  return (
    <div className="page">

      {/* ══ Summary stat tiles ════════════════════════════ */}
      <div className="stat-grid-3" style={{ marginBottom: 24 }}>
        <StatTile
          icon={IcoShield}
          label="Overall score"
          value={`${score}%`}
          sub={`${controls.filter(c => c.status === 'implemented').length}/${controls.length} controls complete`}
          color={scoreColor}
          accent={scoreAccent}
        />
        <StatTile
          icon={IcoCheck}
          label="Principles met"
          value={principlesMet}
          sub={`of ${oblMeta.length} GAPP principles`}
          color="var(--green-dim)"
          accent="#10B981"
        />
        <StatTile
          icon={IcoAlert}
          label="Critical gaps"
          value={criticalGaps}
          sub="Principles with zero progress"
          color={criticalGaps > 0 ? '#DC2626' : 'var(--green-dim)'}
          accent={criticalGaps > 0 ? '#EF4444' : '#10B981'}
        />
      </div>

      {/* ══ Filter chips ══════════════════════════════════ */}
      <div className="assess-filter-bar">
        {FILTER_ORDER.map(f => {
          const label = f === 'all' ? 'All' : (STATUS_META.find(s => s.value === f)?.label ?? f);
          const dot   = STATUS_BAR_COLOR[f];
          return (
            <button key={f} className={`assess-chip${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}>
              {f !== 'all' && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: filter === f ? 'rgba(255,255,255,0.8)' : dot,
                  display: 'inline-block',
                }} />
              )}
              {label}
              <span className="assess-chip-count">{counts[f] ?? 0}</span>
            </button>
          );
        })}
      </div>

      {/* ══ States ════════════════════════════════════════ */}
      {controlsLoading && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '64px 24px', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, border: '3px solid var(--border)',
            borderTop: '3px solid var(--green)', borderRadius: '50%',
            animation: 'spin .8s linear infinite',
          }} />
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Loading controls…</div>
        </div>
      )}

      {!controlsLoading && controlsError && (
        <div style={{
          padding: '32px 24px', textAlign: 'center',
          background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)',
          borderRadius: 'var(--r-lg)', color: 'var(--risk-high-text)', fontSize: 14,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Failed to load controls</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>{controlsError}</div>
        </div>
      )}

      {!controlsLoading && !controlsError && controls.length === 0 && (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--surface)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <IcoShield />
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>
            No controls loaded. Select a tenant workspace to begin.
          </div>
        </div>
      )}

      {grouped.length === 0 && controls.length > 0 && (
        <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
          No controls match this filter.
        </div>
      )}

      {/* ══ Controls grouped by GAPP principle ═══════════ */}
      {grouped.map(({ obl, shown, impl, pct, tone, all }) => (
        <div key={obl.id} style={{ marginBottom: 28 }}>

          {/* Obligation group header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 10, padding: '12px 16px',
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            {/* ID tag */}
            {/* <span className="assess-obl-id" style={{ flexShrink: 0 }}>
              {obl.id.replace(/_/g, '-')}
            </span> */}

            {/* Name */}
            <span className="assess-obl-name" style={{ flex: 1 }}>{obl.name}</span>

            {/* Mini progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ width: 80 }}>
                <Progress value={pct} tone={tone} />
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700, minWidth: 44, textAlign: 'right',
                color: pct >= 70 ? 'var(--green-dim)' : pct >= 30 ? '#B45309' : '#DC2626',
              }}>
                {impl}/{all.length}
              </span>
            </div>
          </div>

          {/* Control rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {shown.map(ctrl => {
              const dotColor     = STATUS_BAR_COLOR[ctrl.status] ?? '#94A3B8';
              const hasAdminComment = ctrl.acts?.some(a =>
                (a.role === 'admin' || a.role === 'reviewer') && a.type === 'comment'
              );
              const needsAttn = hasAdminComment && ctrl.status !== 'implemented';

              return (
                <button
                  key={ctrl.id}
                  className="ctrl-list-item"
                  onClick={() => setOpenCtrl(ctrl.id)}
                >
                  {/* Status bar */}
                  <div className="status-bar" style={{ background: dotColor }} />

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ctrl-item-name">{ctrl.name}</div>
                    <div className="ctrl-item-desc">{ctrl.req}</div>
                  </div>

                  {/* Meta */}
                  <div className="ctrl-item-meta">
                    {ctrl.docs?.length > 0 && (
                      <span className="ctrl-doc-count">
                        <IcoFile />
                        {ctrl.docs.length}
                      </span>
                    )}
                    {needsAttn && (
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        background: 'var(--risk-med-bg)', color: 'var(--risk-med-text)',
                        border: '1px solid var(--risk-med-border)',
                        padding: '2px 7px', borderRadius: 4,
                      }}>
                        Needs attention
                      </span>
                    )}
                    <span className={`status-badge ${statusClass(ctrl.status)}`}>
                      {statusLabel(ctrl.status)}
                    </span>
                    <span className="ctrl-arrow">
                      <IcoChevron />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* ══ Control detail panel ══════════════════════════ */}
      {openCtrlData && (
        <ControlPanel ctrl={openCtrlData} onClose={() => setOpenCtrl(null)}
          staticMode={import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true'} />
      )}
    </div>
  );
}

export default AssessmentPage;
