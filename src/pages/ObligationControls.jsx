import { useState, useEffect } from 'react';
import {
  DPDPA_OBLIGATIONS,
  STATUS_OPTIONS,
  STATUS_CLASS,
} from '../config/obligations';
import { fetchControlsByPrinciple } from '../api';
import { useApp }                   from '../context/AppContext';

/* Normalise whatever the API returns — handles direct array or DRF { results: [] } */
function extractControls(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.results)) return res.results;
  return [];
}

function makeRows(controls) {
  return controls.map((c) => ({
    num:            c.num,
    comments:       '',
    observation:    '',
    status:         '',
    recommendation: '',
    evidence:       '',
  }));
}

function ObligationControls({ oblId }) {
  const { tenant } = useApp();
  const obl = DPDPA_OBLIGATIONS.find((o) => o.id === oblId) ?? DPDPA_OBLIGATIONS[0];

  /* Start with static controls; API response replaces them if non-empty */
  const [controls, setControls] = useState(obl.controls);
  const [rows,     setRows]     = useState(() => makeRows(obl.controls));
  const [loading,  setLoading]  = useState(true);
  const [apiError, setApiError] = useState(null);

  /* key={oblId} in App.jsx forces a fresh mount per obligation,
     so this effect runs exactly once with no dependency juggling. */
  useEffect(() => {
    let cancelled = false;

    fetchControlsByPrinciple(obl.gappPrinciple, tenant?.url)
      .then((res) => {
        if (cancelled) return;
        const raw = extractControls(res);
        if (raw.length > 0) {
          const mapped = raw.map((c, i) => ({
            num:   c.num            ?? c.control_number ?? String(i + 1),
            title: c.title          ?? c.name           ?? c.control_name ?? '',
            ref:   c.ref            ?? c.reference      ?? c.dpdpa_ref    ?? '',
          }));
          setControls(mapped);
          setRows(makeRows(mapped));
        }
        /* empty response → keep static fallback */
      })
      .catch((err) => {
        if (cancelled) return;
        setApiError(err?.message ?? 'Failed to load controls');
        /* static fallback already in state */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (num, field, val) =>
    setRows((rs) => rs.map((r) => (r.num === num ? { ...r, [field]: val } : r)));

  return (
    <div className="page">
      {/* Obligation header */}
      <div className="audit-header">
        <span className="audit-header-badge">{obl.id}</span>
        <div className="audit-header-body">
          <h2 className="audit-header-title">{obl.title}</h2>
          <p className="audit-header-desc">{obl.desc}</p>
          <span className="audit-header-ref">{obl.dpdpRef}</span>
        </div>
      </div>

      {loading  && <p className="audit-loading">Loading controls…</p>}
      {apiError && <p className="audit-error">{apiError} — showing default controls.</p>}

      {/* Audit controls table */}
      <div className="audit-wrap">
        <table className="audit-table">
          <thead>
            <tr>
              <th style={{ width: 72 }}>Control No.</th>
              <th style={{ width: 220 }}>DPDPA Obligation / Control</th>
              <th style={{ width: 120 }}>DPDPA Reference</th>
              <th>Comments</th>
              <th>Observation</th>
              <th style={{ width: 160 }}>Compliance Status</th>
              <th>Recommendation</th>
              <th style={{ width: 140 }}>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {controls.map((ctrl) => {
              const row = rows.find((r) => r.num === ctrl.num);
              if (!row) return null;
              return (
                <tr key={ctrl.num}>
                  <td className="td-num">{ctrl.num}</td>
                  <td className="td-ctrl">{ctrl.title}</td>
                  <td className="td-ref">{ctrl.ref}</td>

                  <td>
                    <textarea
                      className="cell-input"
                      value={row.comments}
                      onChange={(e) => update(ctrl.num, 'comments', e.target.value)}
                      placeholder="Add comments…"
                    />
                  </td>

                  <td>
                    <textarea
                      className="cell-input"
                      value={row.observation}
                      onChange={(e) => update(ctrl.num, 'observation', e.target.value)}
                      placeholder="Observation…"
                    />
                  </td>

                  <td>
                    <select
                      className={`cell-select ${STATUS_CLASS[row.status] ?? ''}`}
                      value={row.status}
                      onChange={(e) => update(ctrl.num, 'status', e.target.value)}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <textarea
                      className="cell-input"
                      value={row.recommendation}
                      onChange={(e) => update(ctrl.num, 'recommendation', e.target.value)}
                      placeholder="Recommendation…"
                    />
                  </td>

                  <td>
                    <input
                      type="text"
                      className="cell-input-line"
                      value={row.evidence}
                      onChange={(e) => update(ctrl.num, 'evidence', e.target.value)}
                      placeholder="Doc / link…"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ObligationControls;
