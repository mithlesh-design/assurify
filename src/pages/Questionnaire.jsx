import { useState, useEffect, useMemo } from 'react';
import { useApp }             from '../context/AppContext';
import { fetchQuestionnaire } from '../api/services/tenants';
import { EmptyState, ErrorState, Icons, LoadingState } from '../ui';

function groupByCategory(items) {
  return items.reduce((acc, q) => {
    (acc[q.category] ??= []).push(q);
    return acc;
  }, {});
}

function QuestionCard({ q }) {
  const selections = Array.isArray(q.selected) ? q.selected.filter(Boolean) : [];
  const isEmpty    = selections.length === 0;
  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 8, lineHeight: 1.5 }}>
        {q.question}
      </div>
      {isEmpty ? (
        <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>No answer provided</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selections.map((sel, i) => (
            <span key={i} style={{
              fontSize: 12, fontWeight: 500, lineHeight: 1.5,
              padding: '3px 10px', borderRadius: 'var(--r-pill)',
              background: 'var(--green-soft)', border: '1px solid var(--green-mid)',
              color: 'var(--green-dim)',
            }}>
              {sel}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PageQuestionnaire({ onAction, onSummary }) {
  const { tenant } = useApp();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchQuestionnaire(tenant?.name);
      setItems(data);
    } catch (err) {
      setError(err.message ?? 'Failed to load questionnaire.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const grouped  = useMemo(() => groupByCategory(items), [items]);
  const cats     = Object.keys(grouped);
  const answered = items.filter(q => Array.isArray(q.selected) && q.selected.length > 0).length;

  useEffect(() => {
    onSummary?.({ loaded: !loading && !error, error: error || null, total: items.length, answered, unanswered: items.length - answered });
  }, [onSummary, loading, error, items.length, answered]);

  if (loading) {
    return <div className="page"><LoadingState label="Loading onboarding responses…" /></div>;
  }

  if (error) {
    return (
      <div className="page">
        <ErrorState title="Couldn't load onboarding responses" message={error} onRetry={load} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page">
        <EmptyState
          icon={<Icons.Clipboard size={22} />}
          title="No onboarding responses yet"
          description="Responses appear here once the client completes the onboarding questionnaire."
        />
      </div>
    );
  }

  return (
    <div className="page">
      {/* Stats */}
      <p className="page-lead">Answers the client gave in the onboarding questionnaire. They help scope the assessment and the RoPA register.</p>
      <div className="tile-grid" style={{ marginBottom: 24 }}>
        <div className="stat-tile">
          <div className="stat-tile-label">Total questions</div>
          <div className="stat-tile-value">{items.length}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">Answered</div>
          <div className={`stat-tile-value ${answered === items.length ? 'ok' : answered > 0 ? 'warn' : 'danger'}`}>
            {answered}
          </div>
          <div className="stat-tile-meta">{items.length > 0 ? Math.round((answered / items.length) * 100) : 0}% complete</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">Categories</div>
          <div className="stat-tile-value">{cats.length}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">Unanswered</div>
          <div className={`stat-tile-value ${items.length - answered > 0 ? 'danger' : 'ok'}`}>
            {items.length - answered}
          </div>
        </div>
      </div>

      {/* Grouped sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {cats.map(cat => (
          <div key={cat} className="card">
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div>
                <div className="card-title">{cat}</div>
                <div className="card-subtitle">{grouped[cat].length} question{grouped[cat].length !== 1 ? 's' : ''}</div>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--r-pill)',
                background: 'var(--green-soft)', color: 'var(--green-dim)', border: '1px solid var(--green-mid)',
              }}>
                {grouped[cat].filter(q => Array.isArray(q.selected) && q.selected.length > 0).length}/{grouped[cat].length} answered
              </span>
            </div>
            <div style={{ padding: '4px 0' }}>
              {grouped[cat].map(q => <QuestionCard key={q.id} q={q} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
