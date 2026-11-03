import { useRef } from 'react';
import { Icons, useDialog } from './ui';
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
      { id: 'gdpr-assessment', label: 'GDPR Assessment',       icon: 'Shield' },
      { id: 'questionnaire',  label: 'Onboarding responses',   icon: 'File' },
      { id: 'meetings',       label: 'Meetings tracker',       icon: 'Calendar' },
      { id: 'evidence',       label: 'Evidence tracker',       icon: 'Clipboard' },
      { id: 'data-breach',    label: 'Data breaches',          icon: 'Alert' },
      { id: 'data-rights',    label: 'Data Principal rights',  icon: 'Users' },
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
      { id: 'vendors',             label: 'Vendors (TPRM)',        icon: 'Building' },
      { id: 'ropa',                label: 'RoPA register',         icon: 'Database' },
      { id: 'policies',            label: 'Policies',              icon: 'File' },
      { id: 'compliance-report',   label: 'Compliance report',     icon: 'Chart' },
      { id: 'reports',             label: 'Board reports',         icon: 'Report' },
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
      { id: 'admin-users',   label: 'Users & reviewers', icon: 'Users' },
      { id: 'admin-tenants', label: 'Tenants',           icon: 'Building' },
    ],
  },
];

const PAGE_TITLES = {
  /* ── Admin pages ── */
  'admin-dashboard': 'Admin Dashboard',
  'admin-users':   'Users & reviewers',
  'admin-tenants': 'Tenants',
  /* ── Profile pages ── */
  'profile':       'My profile',
  'profile-setup': 'Complete your profile',
  /* ── Reviewer pages ── */
  dashboard:          'Assessment Command Center',
  assessment:         'DPDP Assessment',
  'gdpr-assessment':  'GDPR Assessment',
  questionnaire:      'Onboarding responses',
  meetings:           'Meetings tracker',
  evidence:           'Evidence tracker',
  'data-breach':      'Data breach management',
  'data-rights':      'Data Principal rights requests',
  inventory:          'Data inventory',
  consent:            'Consent manager',
  privacy:            'Privacy notice generator',
  vendors:            'Vendor risk management (TPRM)',
  ropa:               'Records of processing activities (RoPA)',
  policies:           'Policies',
  reports:            'Board compliance reports',
  'compliance-report':'DPDP compliance report',
  'obl-1':            'OBL-1 — Consent Management',
  'obl-2':            'OBL-2 — Privacy Notice (Section 5)',
  'obl-3':            'OBL-3 — Data Principal Rights',
  'obl-4':            'OBL-4 — Data Localisation',
  'obl-5':            'OBL-5 — Data Processor Agreements',
  'obl-6':            'OBL-6 — Breach Notification',
  'obl-7':            "OBL-7 — Children's Data (Section 9)",
  'obl-8':            'OBL-8 — Grievance Redressal',
};


function Sidebar({ active, onNavigate, onLogout, nav = NAV, portalLabel, open = false, onClose }) {
  const { user, logout, controls } = useApp();
  const ref           = useRef(null);
  const handleLogout  = onLogout ?? logout;
  const isOblPage     = active.startsWith('obl-');
  const role          = (user?.role ?? '').toLowerCase();
  const isCustomer    = role === 'user';
  const isAdmin       = role === 'admin';

  /* On tablet/phone the sidebar is a drawer: Escape closes it and focus stays inside */
  useDialog(ref, onClose, { active: open });

  const pill = portalLabel ?? (isAdmin ? 'Admin' : isCustomer ? 'Customer' : 'Reviewer');
  const footerRole = isAdmin
    ? 'Admin · Appzlogic'
    : isCustomer
    ? (user?.company ?? 'Customer')
    : 'Reviewer · Appzlogic';

  const urgentCount = controls
    ? controls.filter(c => c.status === 'blocked' || c.status === 'needs_discussion').length
    : 0;

  const go = (id) => { onNavigate(id); onClose?.(); };

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside
        ref={ref}
        className={`sidebar${open ? ' open' : ''}`}
        aria-label="Main navigation"
        {...(open ? { role: 'dialog', 'aria-modal': 'true', tabIndex: -1 } : {})}
      >
        {/* Header */}
        <div className="sidebar-header">
          <img src="/AssurifyLogo.svg" alt="Assurify" className="sidebar-logo" />
          <span className="portal-pill">{pill}</span>
          <button type="button" className="icon-btn sidebar-close" onClick={onClose} aria-label="Close menu">
            <Icons.X size={16} />
          </button>
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
                      type="button"
                      className={`nav-item${isActive ? ' active' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => go(item.id)}
                    >
                      <span className="nav-item-icon"><I size={17} /></span>
                      <span className="nav-item-label">{item.label}</span>
                      {item.badge != null && (
                        <span className="nav-item-badge">{item.badge}</span>
                      )}
                      {item.id === 'assessment' && urgentCount > 0 && (
                        <span className="nav-item-badge" title={`${urgentCount} controls blocked or needing discussion`}>
                          {urgentCount}
                          <span className="sr-only"> controls need attention</span>
                        </span>
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
          {isAdmin ? (
            <div className="user-row user-row-static">
              <div className="user-avatar">{user?.initials ?? '?'}</div>
              <div className="user-info">
                <div className="user-name">{user?.name ?? 'User'}</div>
                <div className="user-role">{footerRole}</div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={`user-row${active === 'profile' ? ' active' : ''}`}
              onClick={() => go('profile')}
              aria-current={active === 'profile' ? 'page' : undefined}
            >
              <div className="user-avatar">{user?.initials ?? '?'}</div>
              <div className="user-info">
                <div className="user-name">{user?.name ?? 'User'}</div>
                <div className="user-role">{footerRole}</div>
              </div>
              <Icons.Settings size={15} className="user-cog" aria-hidden="true" />
              <span className="sr-only">Open my profile</span>
            </button>
          )}
          <button type="button" className="sidebar-signout" onClick={handleLogout}>
            <Icons.Signout size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

/* PageHeader — sticky top bar. `actionsRef` receives the actions container so
   pages can portal their own buttons into it (see <PageActions>). */
function PageHeader({ title, actions, onMenu, actionsRef }) {
  return (
    <header className="page-header">
      {onMenu && (
        <button type="button" className="icon-btn page-header-menu" onClick={onMenu} aria-label="Open menu">
          <Icons.Menu size={18} />
        </button>
      )}
      <h1 className="page-header-title" title={title}>{title}</h1>
      <div className="page-header-actions" ref={actionsRef}>{actions}</div>
    </header>
  );
}

export { NAV, ADMIN_NAV, ASSESSMENT_SUBNAV, PAGE_TITLES, Sidebar, PageHeader };
