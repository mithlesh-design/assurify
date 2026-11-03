/**
 * App.jsx
 *
 * Auth gate → role-based portal routing:
 *   admin    → AdminPortalApp  (Users, Tenants management)
 *   reviewer → ReviewerApp     (full compliance portal)
 *
 * Auth flow:
 *   authReady === false  → AppLoadingScreen
 *   authReady && !user   → Landing / Login
 *   authReady && user    → AdminPortalApp | ReviewerApp
 */

import { useEffect, useState } from 'react';
import { Button, Icons, PageActionsProvider } from './ui';
import { Sidebar, PageHeader, PAGE_TITLES, ADMIN_NAV } from './layout';
import { useApp }               from './context/AppContext';
import { useToast }             from './context/ToastContext';
import Landing            from './pages/Landing';
import Login              from './pages/Login';
import PageDashboard      from './pages/Dashboard';
import PageAssessment     from './pages/Assessment';
import PageInventory      from './pages/Inventory';
import PageConsent        from './pages/Consent';
import PagePrivacy        from './pages/Privacy';
import PageVendors        from './pages/Vendors';
import PageReports        from './pages/Reports';
import ComplianceReport   from './pages/ComplianceReport';
import ObligationControls from './pages/ObligationControls';
import PageQuestionnaire  from './pages/Questionnaire';
import AdminDashboard          from './pages/admin/AdminDashboard';
import AdminUsers              from './pages/admin/Users';
import AdminTenants            from './pages/admin/Tenants';
import PageProfile             from './pages/Profile';
import ProfileSetup            from './pages/ProfileSetup';
import ProfileIncompleteModal  from './components/ProfileIncompleteModal';
import TenantSelectModal       from './components/TenantSelectModal';
import PageRopa                from './pages/Ropa';
import RopaDetail              from './pages/RopaDetail';
import Policies                from './pages/Policies';
import GdprAssessment          from './pages/GdprAssessment';
import MeetingsTracker         from './pages/MeetingsTracker';
import EvidenceTracker         from './pages/EvidenceTracker';
import DataBreach              from './pages/DataBreach';
import DataRights              from './pages/DataRights';
import { fetchMeetings, fetchEvidences } from './api/services/meetEvidence';

/* ── Full-screen loading ─────────────────────────────── */
function AppLoadingScreen() {
  return (
    <div className="app-loading" role="status" aria-live="polite">
      <img src="/AssurifyLogo.svg" alt="Assurify" className="app-loading-logo" />
      <span className="loading-spinner" aria-hidden="true" />
      <p>Checking your session…</p>
    </div>
  );
}

/* Responsive navigation: the sidebar is a drawer below 1024px. Closes itself
   when the window grows back to desktop width. */
function useNavDrawer() {
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => { if (mq.matches) setNavOpen(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return [navOpen, setNavOpen];
}

/* Scroll to the top of the page whenever the user moves to a different page */
function useScrollTopOnPageChange(page) {
  useEffect(() => { window.scrollTo({ top: 0 }); }, [page]);
}

/* ── Root shell — auth gate ──────────────────────────── */
function AppShell() {
  const { user, authReady, sessionExpiredOnLoad } = useApp();
  const toast = useToast();

  const [entryHash]              = useState(() => window.location.hash.replace('#', ''));
  const [runtimeExpired,  setRuntimeExpired]  = useState(false);
  const [showLogin,       setShowLogin]       = useState(false);
  const [modalDismissed,  setModalDismissed]  = useState(false);

  /* Runtime 401 — token expired while app was open */
  useEffect(() => {
    const handler = () => {
      setRuntimeExpired(true);
      setShowLogin(false);
      toast.warning('Session expired. Please sign in again.');
    };
    window.addEventListener('az:session-expired', handler);
    return () => window.removeEventListener('az:session-expired', handler);
  }, [toast]);

  /* Startup expiry — token was already expired when the page loaded */
  useEffect(() => {
    if (sessionExpiredOnLoad && authReady && !user) {
      toast.warning('Your session has expired. Please sign in again.');
    }
  }, [sessionExpiredOnLoad, authReady]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Merge both signals into a single flag */
  const sessionExpired = runtimeExpired || sessionExpiredOnLoad;

  useEffect(() => {
    if (user) { setRuntimeExpired(false); setShowLogin(false); }
  }, [user]);

  if (!authReady) return <AppLoadingScreen />;

  if (!user) {
    const isAppRoute = !!PAGE_TITLES[entryHash];
    const showModal  = sessionExpired || showLogin || (isAppRoute && !modalDismissed);
    const handleClose = () => { setShowLogin(false); setModalDismissed(true); };
    return (
      <>
        <Landing onLogin={() => { setModalDismissed(false); setShowLogin(true); }} />
        {showModal && (
          <Login
            message={sessionExpired ? 'Your session has expired. Please sign in again.' : null}
            onClose={!sessionExpired ? handleClose : null}
          />
        )}
      </>
    );
  }

  const role = (user.role ?? '').toLowerCase();
  return role === 'admin' ? <AdminPortalApp /> : <ReviewerApp />;
}

/* ── Admin portal ────────────────────────────────────── */
function AdminPortalApp() {
  const { logout } = useApp();
  const toast      = useToast();

  const [page, setPage] = useState(() => {
    const h = window.location.hash.replace('#', '');
    return PAGE_TITLES[h] && h.startsWith('admin-') ? h : 'admin-dashboard';
  });

  useEffect(() => { window.location.hash = page; }, [page]);

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '');
      if (PAGE_TITLES[h]) setPage(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (p) => setPage(p);
  const [navOpen, setNavOpen] = useNavDrawer();
  const [actionsSlot, setActionsSlot] = useState(null);
  useScrollTopOnPageChange(page);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully.');
  };

  let pageEl = null;
  if      (page === 'admin-dashboard') pageEl = <AdminDashboard />;
  else if (page === 'admin-users')     pageEl = <AdminUsers />;
  else if (page === 'admin-tenants')   pageEl = <AdminTenants />;

  return (
    <div className="app-shell portal-reviewer">
      <Sidebar active={page} onNavigate={navigate} onLogout={handleLogout} nav={ADMIN_NAV}
        open={navOpen} onClose={() => setNavOpen(false)} />
      <main className="main">
        <PageHeader title={PAGE_TITLES[page] ?? page} onMenu={() => setNavOpen(true)} actionsRef={setActionsSlot} />
        <PageActionsProvider value={actionsSlot}>{pageEl}</PageActionsProvider>
      </main>
    </div>
  );
}

/* ── Reviewer portal ─────────────────────────────────── */
function ReviewerApp() {
  const { user, logout, tenant } = useApp();
  const toast = useToast();

  const [page,               setPage]               = useState(() => {
    const h = window.location.hash.replace('#', '');
    return PAGE_TITLES[h] ? h : 'dashboard';
  });
  const [questKey,           setQuestKey]           = useState(0);
  const [ropaRecordId,       setRopaRecordId]       = useState(null);
  const [meetingRecords, setMeetingRecords] = useState([]);
  const [evidenceRecords, setEvidenceRecords] = useState([]);
  const [ropaSummary, setRopaSummary] = useState(null);
  const [questionnaireSummary, setQuestionnaireSummary] = useState(null);
  const [vendorSummary, setVendorSummary] = useState(null);
  const [showProfilePrompt,  setShowProfilePrompt]  = useState(
    () => user?.profileComplete === false
  );

  useEffect(() => {
    let active = true;
    Promise.all([fetchMeetings(), fetchEvidences()])
      .then(([meetings, evidences]) => {
        if (!active) return;
        setMeetingRecords(meetings);
        setEvidenceRecords(evidences);
      })
      .catch(() => {
        if (active) toast.error('Could not load meetings and evidence records.');
      });
    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { window.location.hash = page; }, [page]);

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '');
      if (PAGE_TITLES[h]) setPage(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const [navOpen, setNavOpen] = useNavDrawer();
  const [actionsSlot, setActionsSlot] = useState(null);
  const [printReport, setPrintReport] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  useScrollTopOnPageChange(page);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [ropaRecordId]);

  const navigate  = (p) => { setPage(p); if (p !== 'ropa') setRopaRecordId(null); };
  const showToast = (msg) => toast.info(msg);
  const openReportForPrint = () => { setPrintReport(true); navigate('compliance-report'); };

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully.');
  };

  /* Full-page report — no sidebar */
  if (page === 'compliance-report') {
    return (
      <ComplianceReport
        onNavigate={(p) => { setPrintReport(false); navigate(p); }}
        autoPrint={printReport}
        onPrinted={() => setPrintReport(false)}
      />
    );
  }

  /* Per-page header actions. Pages that own their primary action (Add vendor,
     Add activity, Export…) render it themselves with <PageActions>. Actions that
     need a backend which does not exist yet are not shown. */
  let headerActions = null;
  if (page === 'dashboard') {
    headerActions = (
      <>
        <Button icon={<Icons.Report size={15} />} onClick={() => navigate('compliance-report')}>View report</Button>
        <Button variant="primary" onClick={() => navigate('assessment')}>
          Review assessment <Icons.ChevronRight size={15} />
        </Button>
      </>
    );
  } else if (page === 'assessment' || page.startsWith('obl-')) {
    headerActions = (
      <>
        <Button icon={<Icons.Download size={15} />} onClick={openReportForPrint} title="Opens the compliance report and your browser's Save as PDF dialog">
          Export PDF
        </Button>
        <Button variant="primary" icon={<Icons.Report size={15} />} onClick={() => navigate('compliance-report')}>
          Compliance report
        </Button>
      </>
    );
  } else if (page === 'questionnaire') {
    headerActions = (
      <Button icon={<Icons.Refresh size={15} />} onClick={() => setQuestKey(k => k + 1)}>
        Refresh
      </Button>
    );
  }

  /* Page routing */
  let pageEl = null;
  if      (page === 'dashboard')      pageEl = <PageDashboard     onNavigate={navigate} onAction={showToast} meetings={meetingRecords} evidence={evidenceRecords} ropaSummary={ropaSummary} questionnaireSummary={questionnaireSummary} vendorSummary={vendorSummary} />;
  else if (page === 'assessment')     pageEl = <PageAssessment />;
  else if (page === 'gdpr-assessment') pageEl = <GdprAssessment />;
  else if (page === 'inventory')      pageEl = <PageInventory     onAction={showToast} />;
  else if (page === 'consent')        pageEl = <PageConsent       onAction={showToast} />;
  else if (page === 'privacy')        pageEl = <PagePrivacy       onAction={showToast} />;
  else if (page === 'vendors')        pageEl = <PageVendors       onAction={showToast} onSummary={setVendorSummary} />;
  else if (page === 'reports')        pageEl = <PageReports       onAction={showToast} />;
  else if (page === 'questionnaire')  pageEl = <PageQuestionnaire key={questKey} onAction={showToast} onSummary={setQuestionnaireSummary} />;
  else if (page === 'meetings') pageEl = <MeetingsTracker meetings={meetingRecords} setMeetings={setMeetingRecords} evidence={evidenceRecords} setEvidence={setEvidenceRecords} onAction={showToast} />;
  else if (page === 'evidence') pageEl = <EvidenceTracker evidence={evidenceRecords} setEvidence={setEvidenceRecords} onAction={showToast} />;
  else if (page === 'data-breach') pageEl = <DataBreach onAction={showToast} />;
  else if (page === 'data-rights') pageEl = <DataRights onAction={showToast} />;
  else if (page === 'ropa') {
    pageEl = ropaRecordId
      ? <RopaDetail
          recordId={ropaRecordId}
          onBack={() => setRopaRecordId(null)}
          onAction={showToast}
        />
      : <PageRopa
          onAction={showToast}
          onSummary={setRopaSummary}
          onSelectRecord={(id) => setRopaRecordId(id)}
        />;
  }
  else if (page === 'policies') pageEl = <Policies onAction={showToast} />;
  else if (page === 'profile')        pageEl = <PageProfile />;
  else if (page === 'profile-setup')  pageEl = <ProfileSetup onDone={() => navigate('dashboard')} />;
  else if (page.startsWith('obl-')) {
    const oblId = page.replace('obl-', 'OBL-');
    pageEl = <ObligationControls key={oblId} oblId={oblId} />;
  }

  const portalClass = (user?.role ?? '').toLowerCase() === 'user' ? 'portal-customer' : 'portal-reviewer';

  return (
    <div className={`app-shell ${portalClass}`}>
      <Sidebar active={page} onNavigate={navigate} onLogout={handleLogout}
        open={navOpen} onClose={() => setNavOpen(false)} onSwitchWorkspace={() => setShowSwitcher(true)} />
      <main className="main">
        <PageHeader title={PAGE_TITLES[page] ?? page} actions={headerActions}
          onMenu={() => setNavOpen(true)} actionsRef={setActionsSlot} />
        <PageActionsProvider value={actionsSlot}>{pageEl}</PageActionsProvider>
      </main>
      {(!tenant || showSwitcher) && page !== 'profile-setup' && (
        <TenantSelectModal
          currentId={tenant?.id}
          onCancel={tenant ? () => setShowSwitcher(false) : undefined}
          onDone={(t) => { setShowSwitcher(false); if (tenant) toast.success(`Switched to ${t.name}.`); }}
        />
      )}
      {showProfilePrompt && (
        <ProfileIncompleteModal
          onComplete={() => { setShowProfilePrompt(false); navigate('profile-setup'); }}
          onDismiss={() => setShowProfilePrompt(false)}
        />
      )}
    </div>
  );
}

export default AppShell;
