import { useState, useEffect, useRef } from 'react';
import Scene3D from './components/effects/Scene3D';
import TranscriptInput from './components/ui/TranscriptInput';
import ResultCards from './components/ui/ResultCards';
import ArchiveView from './components/views/ArchiveView';
import ActionItemsView from './components/views/ActionItemsView';
import AnalyticsView from './components/views/AnalyticsView';
import CompareView from './components/views/CompareView';
import SettingsModal from './components/ui/SettingsModal';
import CursorGlow from './components/effects/CursorGlow';
import ParticleBurst from './components/effects/ParticleBurst';
import KonamiEasterEgg from './components/effects/KonamiEasterEgg';
import ConfettiCannon from './components/effects/ConfettiCannon';
import { analyzeTranscript } from './services/gemini';
import { getHistory, saveHistory, migrateOldData } from './services/storage';

/* ──────────────────────────────────────────────
   WITTY LOADING MESSAGES
   ────────────────────────────────────────────── */
const LOADING_MESSAGES = [
  { text: 'Decoding corporate hieroglyphics...', sub: 'translating jargon to human' },
  { text: 'Teaching AI to read between the lines...', sub: 'passive aggression detected' },
  { text: 'Finding who actually owns what...', sub: '"I thought YOU were doing that"' },
  { text: 'Separating genius from filler...', sub: 'ratio: still calculating' },
  { text: 'Extracting action items from chaos...', sub: 'this meeting could\'ve been an email' },
  { text: 'Neural pathways firing...', sub: 'gemini-2.5-flash · deep analysis' },
  { text: 'Scanning for hidden decisions...', sub: '"so are we doing this or not?"' },
  { text: 'Mapping the conversation cosmos...', sub: 'star chart: 47% aligned' },
  { text: 'Quantifying meeting productivity...', sub: 'spoiler: you\'ll want to sit down' },
  { text: 'Analyzing tone & sentiment...', sub: 'detecting "per my last email" energy' },
  { text: 'Condensing 60 minutes into clarity...', sub: 'compression ratio: extreme' },
  { text: 'Identifying the real MVP...', sub: 'hint: it\'s the note-taker' },
];

export default function App() {
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewTransition, setViewTransition] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // 🌙 Theme toggle
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('briefmind-theme') || 'light'; }
    catch { return 'light'; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('briefmind-theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Witty loading message rotation
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const loadingMsgRef = useRef(null);

  // View routing
  const [activeView, setActiveView] = useState('workspace');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Migrate old data on mount
  useEffect(() => { migrateOldData(); }, []);

  // Rotate loading messages
  useEffect(() => {
    if (!loading) return;
    setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    
    loadingMsgRef.current = setInterval(() => {
      setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    }, 3000);

    return () => clearInterval(loadingMsgRef.current);
  }, [loading]);

  const navigateTo = (view) => {
    setViewTransition(true);
    setSidebarOpen(false);
    setTimeout(() => { setActiveView(view); setViewTransition(false); }, 300);
  };

  const handleAnalyze = async () => {
    if (!transcript.trim() || transcript.trim().length < 50) return;
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeTranscript(transcript);
      // Save to namespaced history
      try {
        const history = getHistory();
        history.unshift({
          result: data,
          transcript: transcript.substring(0, 500), // store first 500 chars for reference
          timestamp: Date.now(),
          preview: data.summary?.substring(0, 120) + '...' || 'Meeting analysis'
        });
        saveHistory(history);
      } catch { /* storage full or unavailable */ }

      setViewTransition(true);
      setTimeout(() => {
        setResult(data);
        setViewTransition(false);
        // 🎉 Fire confetti on successful analysis!
        setConfettiTrigger(prev => prev + 1);
      }, 400);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setViewTransition(true);
    setTimeout(() => { setResult(null); setError(null); setTranscript(''); setViewTransition(false); }, 400);
  };

  const handleNewAnalysis = () => {
    navigateTo('workspace');
    setTimeout(() => { setResult(null); setError(null); setTranscript(''); }, 350);
  };

  // Update result in-place (for editable action items)
  const handleUpdateResult = (newResult) => {
    setResult(newResult);
    // Also update in history
    try {
      const history = getHistory();
      if (history.length > 0 && history[0].result.summary === newResult.summary) {
        history[0].result = newResult;
        saveHistory(history);
      }
    } catch { /* ignore */ }
  };

  // Determine which nav/sidebar items are active
  const navMap = {
    'workspace': 'Intelligence',
    'archive': 'Archive',
    'action-items': 'Intelligence',
    'analytics': 'Intelligence',
    'compare': 'Compare',
  };
  const activeNav = navMap[activeView] || 'Intelligence';

  const sidebarMap = {
    'workspace': 'Workspace',
    'archive': 'Transcripts',
    'action-items': 'Action Items',
    'analytics': 'Analytics',
    'compare': 'Compare',
  };
  const activeSidebar = sidebarMap[activeView] || 'Workspace';

  // Render main content based on activeView
  const renderContent = () => {
    switch (activeView) {
      case 'archive':
        return <ArchiveView />;
      case 'action-items':
        return <ActionItemsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'compare':
        return <CompareView />;
      case 'workspace':
      default:
        return result ? (
          <ResultCards result={result} onReset={handleReset} onUpdateResult={handleUpdateResult} />
        ) : (
          <TranscriptInput
            transcript={transcript}
            setTranscript={setTranscript}
            onAnalyze={handleAnalyze}
            loading={loading}
          />
        );
    }
  };

  return (
    <>
      {/* Grain Overlay — Stitch texture */}
      <div className="grain-overlay" />

      {/* Metallic Blobs — Background atmosphere */}
      <div className="metallic-blob metallic-blob--1" />
      <div className="metallic-blob metallic-blob--2" />

      {/* Orbiting Rings — CSS ellipses */}
      <div className="orbiting-rings">
        <div className="orbit-ring orbit-ring--1" />
        <div className="orbit-ring orbit-ring--2" />
      </div>

      {/* 3D Scene */}
      <Scene3D />

      {/* Cursor Glow */}
      <CursorGlow />

      {/* ✨ FUN: Particle Burst on click */}
      <ParticleBurst />

      {/* 🎮 FUN: Konami Code Easter Egg */}
      <KonamiEasterEgg />

      {/* 🎉 FUN: Confetti on analysis completion */}
      <ConfettiCannon trigger={confettiTrigger} />

      {/* ===== NAVIGATION — Stitch exact ===== */}
      <nav className="top-nav">
        <div className="top-nav-inner">
          <div className="nav-brand text-gradient" onClick={() => navigateTo('workspace')} style={{ cursor: 'pointer' }}>
            S.N.A.P.
          </div>

          <div className="nav-links">
            <button
              className={activeNav === 'Archive' ? 'nav-link--active' : 'nav-link--inactive'}
              onClick={() => navigateTo('archive')}
            >Archive</button>
            <button
              className={activeNav === 'Intelligence' ? 'nav-link--active' : 'nav-link--inactive'}
              onClick={() => navigateTo('workspace')}
            >Intelligence</button>
            <button
              className={activeNav === 'Compare' ? 'nav-link--active' : 'nav-link--inactive'}
              onClick={() => navigateTo('compare')}
            >Compare</button>
            <button
              className="nav-link--inactive"
              onClick={() => setSettingsOpen(true)}
            >Settings</button>
          </div>

          <div className="nav-right">
            {/* 🍔 Hamburger Menu (Mobile) */}
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Menu"
            >
              <span className="material-symbols-outlined">{sidebarOpen ? 'close' : 'menu'}</span>
            </button>

            {/* 🌙 Theme Toggle */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              <span className="material-symbols-outlined theme-toggle-icon sun-icon">light_mode</span>
              <span className="material-symbols-outlined theme-toggle-icon moon-icon">dark_mode</span>
            </button>

            <button
              className="nav-calendar-btn"
              onClick={() => window.open('https://calendar.google.com', '_blank')}
            >Connect Calendar</button>
            <div className="profile-wrapper">
              <span
                className="material-symbols-outlined nav-avatar"
                onClick={() => setProfileOpen(!profileOpen)}
              >account_circle</span>
              {profileOpen && (
                <div className="profile-dropdown glass-card">
                  <button className="profile-dropdown-item" onClick={() => { setSettingsOpen(true); setProfileOpen(false); }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span>
                    Settings
                  </button>
                  <button className="profile-dropdown-item" onClick={() => { setProfileOpen(false); window.open('https://calendar.google.com', '_blank'); }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_month</span>
                    Calendar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* ===== SIDEBAR — Stitch slide-in ===== */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="material-symbols-outlined">auto_awesome</span>
          </div>
          <div>
            <div className="sidebar-brand-name">S.N.A.P.</div>
            <div className="sidebar-brand-sub">Celestial Archive</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${activeSidebar === 'Workspace' ? 'sidebar-link--active' : 'sidebar-link--inactive'}`}
            onClick={() => navigateTo('workspace')}
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            Workspace
          </button>
          <button
            className={`sidebar-link ${activeSidebar === 'Transcripts' ? 'sidebar-link--active' : 'sidebar-link--inactive'}`}
            onClick={() => navigateTo('archive')}
          >
            <span className="material-symbols-outlined">description</span>
            Transcripts
          </button>
          <button
            className={`sidebar-link ${activeSidebar === 'Action Items' ? 'sidebar-link--active' : 'sidebar-link--inactive'}`}
            onClick={() => navigateTo('action-items')}
          >
            <span className="material-symbols-outlined">playlist_add_check</span>
            Action Items
          </button>
          <button
            className={`sidebar-link ${activeSidebar === 'Analytics' ? 'sidebar-link--active' : 'sidebar-link--inactive'}`}
            onClick={() => navigateTo('analytics')}
          >
            <span className="material-symbols-outlined">insights</span>
            Analytics
          </button>
          <button
            className={`sidebar-link ${activeSidebar === 'Compare' ? 'sidebar-link--active' : 'sidebar-link--inactive'}`}
            onClick={() => navigateTo('compare')}
          >
            <span className="material-symbols-outlined">compare_arrows</span>
            Compare
          </button>
        </nav>

        <button className="sidebar-new-btn" onClick={handleNewAnalysis}>
          <span className="material-symbols-outlined">add</span>
          New Analysis
        </button>

        <div className="sidebar-footer">
          <button className="sidebar-footer-link" onClick={() => window.open('mailto:support@snap.app', '_blank')}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>help</span>
            Support
          </button>
          <button className="sidebar-footer-link" onClick={() => setSettingsOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span>
            Account
          </button>
        </div>
      </aside>

      {/* ===== SETTINGS MODAL ===== */}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

      {/* ===== LOADING OVERLAY — with witty messages ===== */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-orb">
            <div className="loading-orb-inner" />
          </div>
          <p className="loading-text text-gradient" key={loadingMsg.text}>{loadingMsg.text}</p>
          <p className="loading-subtext">{loadingMsg.sub}</p>
          <div className="loading-progress">
            <div className="loading-progress-bar" />
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className={`main-content ${viewTransition ? 'view-exit' : ''}`}>
        {/* Header - only show on workspace */}
        {activeView === 'workspace' && !result && (
          <header className="app-header">
            <div className="hero-icon hero-icon--playful">
              <span className="material-symbols-outlined">edit_note</span>
            </div>
            <h1 className="app-title text-gradient">S.N.A.P.</h1>
            <p className="app-subtitle">Semantic Notes & Action Processor.</p>
          </header>
        )}

        {/* Error */}
        {error && (
          <div className="error-banner">
            <span style={{ fontSize: '1.15rem' }}>⚠️</span>
            <span className="error-text">{error}</span>
            <button className="error-dismiss" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Views */}
        {renderContent()}
      </main>

      <footer className="app-footer">
        S.N.A.P. v5.0.0 // intelligent meeting analysis
      </footer>
    </>
  );
}
