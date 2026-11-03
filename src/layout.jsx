import { Icons } from './ui';
import { useApp } from './context/AppContext';

const ASSESSMENT_SUBNAV = [
  { id: 'obl-1', oblId: 'OBL-1', label: 'Consent management' },
  { id: 'obl-2', oblId: 'OBL-2', label: 'Privacy notice' },
  { id: 'obl-3', oblId: 'OBL-3', label: 'Data Principal rights' },
  { id: 'obl-4', oblId: 'OBL-4', label: 'Data localisation' },
  { id: 'obl-5', oblId: 'OBL-5', label: 'Processor agreements' },
  { id: 'obl-6', oblId: 'OBL-6', label: 'Breach notification' },
  { id: 'obl-7', oblId: 'OBL-7', label: "Children's data" },
  { id: 'obl-8', oblId: 'OBL-8', label: 'Grievance redressal' },
];

/* ── Reviewer nav ─────────────────────────────────────── */
const NAV = [
  {
    section: 'Overview',
    items: [
      { id: 'dashboard',      label: 'Dashboard',              icon: 'Dashboard' },
      { id: 'assessment',     label: 'DPDP Assessment',        icon: 'Shield' },
      { id: 'gdpr-assessment', label: 'GDPR Assessment', icon: 'Shield' },
      { id: 'questionnaire',  label: 'Onboarding responses',   icon: 'File' },
      { id: 'meetings', label: 'Meetings Tracker', icon: 'Calendar' },
      { id: 'evidence', label: 'Evidence Tracker', icon: 'Shield' },
      { id: 'data-breach', label: 'Data Breach', icon: 'Alert' },
      { id: 'data-rights', label: 'Data Principal Rights', icon: 'Users' },
    ],
  },
  /* Temporarily hidden until these modules are in use.
  {
    section: 'Data & Privacy',
    items: [
      { id: 'inventory', label: 'Data inventory',  icon: 'Database' },
      { id: 'consent',   label: 'Consent manager', icon: 'Eye' },
      { id: 'privacy',   label: 'Privacy notice',  icon: 'File' },
    ],
  },
  */
  {
    section: 'Compliance',
    items: [
      { id: 'vendors',             label: 'Vendors (TPRM)',        icon: 'Building', badge: 7 },
      { id: 'ropa',                label: 'RoPA Register',         icon: 'File' },
      { id: 'policies',            label: 'Policies',               icon: 'File' },
      { id: 'compliance-report',   label: 'Compliance report',     icon: 'Chart' },
      { id: 'reports',             label: 'Board reports',         icon: 'File' },
    ],
  },
];

/* ── Admin nav ────────────────────────────────────────── */
const ADMIN_NAV = [
  {
    section: 'Overview',
    items: [
      { id: 'admin-dashboard', label: 'Dashboard', icon: 'Dashboard' },
    ],
  },
  {
    section: 'Management',
    items: [
      { id: 'admin-users',   label: 'Users & Reviewers', icon: 'Database' },
      { id: 'admin-tenants', label: 'Tenants',           icon: 'Building' },
    ],
  },
];

const PAGE_TITLES = {
  /* ── Admin pages ── */
  'admin-dashboard': 'Admin Dashboard',
  'admin-users':   'Users & Reviewers',
  'admin-tenants': 'Tenants',
  /* ── Profile pages ── */
  'profile':       'My profile',
  'profile-setup': 'Complete your profile',
  /* ── Reviewer pages ── */
  dashboard:          'Assessment Command Centre',
  assessment:         'DPDP Assessment',
  'gdpr-assessment':  'GDPR Assessment',
  questionnaire:      'Onboarding Questionnaire',
  meetings:           'Meetings Tracker',
  evidence:           'Evidence Tracker',
  'data-breach':      'Data Breach Management',
  'data-rights':      'Data Principal Rights Requests',
  inventory:          'Data Inventory',
  consent:            'Consent Manager',
  privacy:            'Privacy Notice Generator',
  vendors:            'Vendor Risk Management (TPRM)',
  ropa:               'Records of Processing Activities (RoPA)',
  policies:           'Policies',
  reports:            'Board Compliance Reports',
  'compliance-report':'DPDP Compliance Report',
  'obl-1':            'OBL-1 — Consent Management',
  'obl-2':            'OBL-2 — Privacy Notice (Section 5)',
  'obl-3':            'OBL-3 — Data Principal Rights',
  'obl-4':            'OBL-4 — Data Localisation',
  'obl-5':            'OBL-5 — Data Processor Agreements',
  'obl-6':            'OBL-6 — Breach Notification',
  'obl-7':            "OBL-7 — Children's Data (Section 9)",
  'obl-8':            'OBL-8 — Grievance Redressal',
};


function Sidebar({ active, onNavigate, onLogout, nav = NAV, portalLabel }) {
  const { user, logout, controls } = useApp();
  const handleLogout  = onLogout ?? logout;
  const isOblPage     = active.startsWith('obl-');
  const role          = (user?.role ?? '').toLowerCase();
  const isCustomer    = role === 'user';
  const isAdmin       = role === 'admin';

  const pill = portalLabel ?? (isAdmin ? 'Admin' : isCustomer ? 'Customer' : 'Reviewer');
  const footerRole = isAdmin
    ? 'Admin · Appzlogic'
    : isCustomer
    ? (user?.company ?? 'Customer')
    : 'Reviewer · Appzlogic';

  const urgentCount = controls
    ? controls.filter(c => c.status === 'blocked' || c.status === 'needs_discussion').length
    : 0;

  return (
    <aside className="sidebar">
      {/* Header — white background */}
      <div className="sidebar-header">
        <img
          src="/AssurifyLogo.svg"
          alt="Assurify"
          style={{ height: 36, width: 'auto', objectFit: 'contain', display: 'block', minWidth: 0, flex: 1 }}
        />
        <span className="portal-pill">{pill}</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav-scroll">
        {nav.map((group) => (
          <div key={group.section}>
            <div className="sidebar-section">{group.section}</div>
            <div className="sidebar-nav">
              {group.items.map((item) => {
                const I = Icons[item.icon];
                const isActive = item.id === 'assessment'
                  ? active === 'assessment' || isOblPage
                  : active === item.id;

                return (
                  <button
                    key={item.id}
                    className={`nav-item${isActive ? ' active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                  >
                    <span className="nav-item-icon"><I size={16} /></span>
                    <span className="nav-item-label">{item.label}</span>
                    {item.badge != null && (
                      <span className="nav-item-badge">{item.badge}</span>
                    )}
                    {item.id === 'assessment' && urgentCount > 0 && (
                      <span className="nav-item-badge">{urgentCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div
          className="user-row"
          onClick={!isAdmin ? () => onNavigate('profile') : undefined}
          style={!isAdmin ? { cursor: 'pointer' } : {}}
          title={!isAdmin ? 'View profile' : undefined}
        >
          <div className="user-avatar">{user?.initials ?? '?'}</div>
          <div className="user-info">
            <div className="user-name">{user?.name ?? 'User'}</div>
            <div className="user-role">{footerRole}</div>
          </div>
          {!isAdmin && <Icons.Settings size={14} className="user-cog" />}
        </div>
        <button className="sidebar-signout" onClick={handleLogout}>
          <Icons.Signout size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

function PageHeader({ title, actions }) {
  return (
    <div className="page-header">
      <h1 className="page-header-title">{title}</h1>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

export { NAV, ADMIN_NAV, ASSESSMENT_SUBNAV, PAGE_TITLES, Sidebar, PageHeader };
