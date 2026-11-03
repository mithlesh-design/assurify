import { useState } from 'react';
import { Icons, Badge, Button, StatTile, SourceIcon, Modal } from '../ui';

const SOURCES = [
  { id: 1, name: 'MySQL Production DB', type: 'Database', typeKind: 'database', typeTone: 'blue',
    pii: ['Names', 'Emails', 'Phone', 'Aadhaar'], records: '3,240 records',
    legal: 'missing', risk: 'high', lastScan: '2 hours ago' },
  { id: 2, name: 'Google Workspace Drive', type: 'Cloud storage', typeKind: 'cloud', typeTone: 'amber',
    pii: ['Employee Aadhaar', 'Salary data', 'PAN'], records: '847 files',
    legal: 'missing', risk: 'high', lastScan: '2 hours ago' },
  { id: 3, name: 'Salesforce CRM', type: 'CRM', typeKind: 'crm', typeTone: 'cyan',
    pii: ['Customer names', 'Emails', 'Phone', 'Addresses'], records: '1,240 contacts',
    legal: 'missing', risk: 'high', lastScan: '2 hours ago' },
  { id: 4, name: 'AWS S3 (3 buckets)', type: 'Object storage', typeKind: 'object', typeTone: 'amber',
    pii: ['User-uploaded documents'], records: '12,500 objects',
    legal: 'contract', risk: 'med', lastScan: '3 hours ago' },
  { id: 5, name: 'Razorpay', type: 'Payment processor', typeKind: 'payment', typeTone: 'purple',
    pii: ['Payment card data', 'Billing address'], records: '890 transactions',
    legal: 'contract', risk: 'med', lastScan: '3 hours ago' },
  { id: 6, name: 'Zoho Mail', type: 'Email service', typeKind: 'email', typeTone: 'green',
    pii: ['Employee emails', 'Customer correspondence'], records: '184k messages',
    legal: 'consent', risk: 'med', lastScan: '5 hours ago' },
  { id: 7, name: 'Twilio SMS', type: 'Communications', typeKind: 'sms', typeTone: 'pink',
    pii: ['Phone numbers', 'SMS content'], records: '62k messages',
    legal: 'contract', risk: 'low', lastScan: 'Yesterday' },
];

const RISK_TONE = { high: 'high', med: 'med', low: 'low' };

const LEGAL_LABEL = {
  missing: (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--risk-high-text)', fontWeight: 500 }}>
      <Icons.Alert size={13} />Not documented
    </span>
  ),
  contract: (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--risk-low-text)' }}>
      <Icons.Check size={13} />Contract
    </span>
  ),
  consent: (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--risk-low-text)' }}>
      <Icons.Check size={13} />Consent
    </span>
  ),
};

function PageInventory({ onAction }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = SOURCES.filter((s) => {
    if (filter !== 'all' && s.risk !== filter) return false;
    if (query && !s.name.toLowerCase().includes(query.toLowerCase()) &&
        !s.type.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const total = SOURCES.length;
  const highRisk = SOURCES.filter((s) => s.risk === 'high').length;
  const noLegal = SOURCES.filter((s) => s.legal === 'missing').length;

  return (
    <div className="page">
      <div className="stat-grid-3">
        <StatTile label="Data sources found" value={total} meta="Across cloud and on-prem" />
        <StatTile label="High / critical risk" value={highRisk} tone="danger" meta="PII exposure detected" />
        <StatTile label="No legal basis documented" value={noLegal} tone="danger" meta="Requires immediate action" />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 22, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search" style={{ flex: '1 1 280px', maxWidth: 400 }}>
          <Icons.Search size={15} style={{ color: 'var(--text-dim)' }} />
          <input placeholder="Search data sources…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="filter-pills">
          {[
            { id: 'all', label: 'All Risks', count: total },
            { id: 'high', label: 'High', count: SOURCES.filter(s => s.risk === 'high').length },
            { id: 'med', label: 'Medium', count: SOURCES.filter(s => s.risk === 'med').length },
            { id: 'low', label: 'Low', count: SOURCES.filter(s => s.risk === 'low').length },
          ].map((f) => (
            <button key={f.id} className={`filter-pill${filter === f.id ? ' active' : ''}`}
              onClick={() => setFilter(f.id)}>
              {f.label}
              <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>Data source</th>
              <th>Type</th>
              <th>PII detected</th>
              <th>Records</th>
              <th>Legal basis</th>
              <th style={{ paddingRight: 20 }}>Risk</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} style={{ cursor: 'pointer' }}>
                <td style={{ paddingLeft: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <SourceIcon type={s.typeKind} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>
                        Scanned {s.lastScan}
                      </div>
                    </div>
                  </div>
                </td>
                <td><span className={`tag tag-${s.typeTone}`}>{s.type}</span></td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {s.pii.slice(0, 2).map((p) => (
                      <span key={p} className="tag" style={{ fontSize: 11.5, padding: '2px 7px' }}>{p}</span>
                    ))}
                    {s.pii.length > 2 && (
                      <span className="tag" style={{ fontSize: 11.5, padding: '2px 7px', color: 'var(--text-subtle)' }}>
                        +{s.pii.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="tbl-num">{s.records}</td>
                <td>{LEGAL_LABEL[s.legal]}</td>
                <td style={{ paddingRight: 20 }}>
                  <Badge tone={RISK_TONE[s.risk]} dot>
                    {s.risk === 'high' ? 'High' : s.risk === 'med' ? 'Medium' : 'Low'}
                  </Badge>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 48, color: 'var(--text-subtle)' }}>
                  No data sources match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal
          title="Add data source"
          icon={<Icons.Database size={18} style={{ color: 'var(--primary)' }} />}
          onClose={() => setShowAdd(false)}
          footer={<>
            <Button onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { setShowAdd(false); onAction('Source added — scanning now'); }}>
              Connect &amp; scan
            </Button>
          </>}
        >
          <label className="field-label">Source type</label>
          <select className="select">
            <option>Database (MySQL / Postgres / Mongo)</option>
            <option>Cloud storage (S3 / GCS / Azure Blob)</option>
            <option>CRM (Salesforce / HubSpot)</option>
            <option>Payment processor</option>
            <option>Communications (Email / SMS)</option>
          </select>
          <div style={{ height: 14 }} />
          <label className="field-label">Display name</label>
          <input className="input" placeholder="e.g. Production analytics warehouse" />
          <div style={{ height: 14 }} />
          <label className="field-label">Connection string</label>
          <input className="input" placeholder="postgresql://…" type="password" />
          <div className="field-hint">
            Credentials are encrypted at rest and only used by the scanning worker.
          </div>
        </Modal>
      )}

      <div data-add-source-portal style={{ display: 'none' }} onClick={() => setShowAdd(true)} />
    </div>
  );
}

export default PageInventory;
