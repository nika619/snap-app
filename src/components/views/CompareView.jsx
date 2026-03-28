import { useState, useEffect, useRef } from 'react';
import { analyzeTranscript, compareMeetings } from '../../services/gemini';
import { getHistory } from '../../services/storage';

/* ================================
   DIFF TAG
   ================================ */
function DiffTag({ type }) {
  const colors = {
    'carried-over': { bg: 'rgba(56,189,248,0.12)', color: '#38bdf8', label: 'CARRIED OVER' },
    'completed': { bg: 'rgba(52,211,153,0.12)', color: '#34d399', label: 'COMPLETED' },
    'dropped': { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'DROPPED' },
    'new': { bg: 'rgba(217,70,239,0.12)', color: '#D946EF', label: 'NEW' },
    'revisited': { bg: 'rgba(251,191,36,0.12)', color: '#b45309', label: 'REVISITED' },
  };
  const c = colors[type] || colors['new'];
  return (
    <span className="diff-tag" style={{ background: c.bg, color: c.color }}>{c.label}</span>
  );
}

/* ================================
   PROGRESS RING
   ================================ */
function ProgressRing({ score }) {
  const size = 120;
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#34d399' : score >= 40 ? '#d97706' : '#ef4444';

  return (
    <div className="compare-progress-ring">
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius}
          stroke="rgba(0,0,0,0.08)" strokeWidth="8" fill="none" />
        <circle cx={size/2} cy={size/2} r={radius}
          stroke={color} strokeWidth="8" fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.5s ease-out', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
        <text x="50%" y="50%" textAnchor="middle" dy=".35em"
          style={{ fontSize: '1.8rem', fontWeight: 700, fill: color, fontFamily: 'var(--font-headline)' }}>
          {score}
        </text>
      </svg>
      <span className="compare-progress-label">Progress Score</span>
    </div>
  );
}

export default function CompareView() {
  const [transcriptA, setTranscriptA] = useState('');
  const [transcriptB, setTranscriptB] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState(null);

  const [listeningTo, setListeningTo] = useState(null);
  const recognitionRef = useRef(null);
  const activeListenerRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          if (activeListenerRef.current === 'A') {
            setTranscriptA(prev => (prev + ' ' + finalTranscript).trim());
          } else if (activeListenerRef.current === 'B') {
            setTranscriptB(prev => (prev + ' ' + finalTranscript).trim());
          }
        }
      };

      recognition.onend = () => setListeningTo(null);
      recognition.onerror = () => setListeningTo(null);

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListen = (target) => {
    if (listeningTo === target) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        alert("Your browser does not support Speech Recognition. Try using Chrome or Edge.");
        return;
      }
      try {
        if (listeningTo) recognitionRef.current.stop();
        activeListenerRef.current = target;
        recognitionRef.current.start();
        setListeningTo(target);
      } catch (err) {
        console.error("Speech recognition error:", err);
      }
    }
  };

  const handleCompare = async () => {
    if (!transcriptA.trim() || !transcriptB.trim()) return;
    setLoading(true);
    setError(null);
    setComparison(null);

    try {
      setLoadingStage('Analyzing Meeting A...');
      const analysisA = await analyzeTranscript(transcriptA);

      setLoadingStage('Analyzing Meeting B...');
      const analysisB = await analyzeTranscript(transcriptB);

      setLoadingStage('Comparing meetings...');
      const diff = await compareMeetings(analysisA, analysisB);

      setComparison({ ...diff, analysisA, analysisB });
    } catch (err) {
      setError(err.message || 'Comparison failed');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleReset = () => {
    setComparison(null);
    setError(null);
    setTranscriptA('');
    setTranscriptB('');
  };

  // Load from history — uses the correct namespaced storage
  const loadFromHistory = (setter) => {
    try {
      const history = getHistory();
      if (history.length === 0) {
        alert('No meeting history found. Analyze a meeting first!');
        return;
      }
      const pick = prompt(`Enter history index (0-${history.length - 1}) to load, or cancel:`);
      if (pick !== null && history[parseInt(pick)]) {
        setter(history[parseInt(pick)].transcript || JSON.stringify(history[parseInt(pick)].result, null, 2));
      }
    } catch { /* ignore */ }
  };

  if (comparison) {
    return (
      <div className="compare-results">
        <div className="view-header">
          <div>
            <h2 className="view-title text-gradient">Meeting Comparison</h2>
            <p className="view-subtitle">Diff analysis between two meetings</p>
          </div>
          <button className="btn-ghost" onClick={handleReset}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
            New Comparison
          </button>
        </div>

        {/* Overall Diff + Progress */}
        <div className="compare-overview glass-card">
          <div className="compare-overview-text">
            <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>Overall Assessment</h3>
            <p className="summary-text">{comparison.overallDiff}</p>
          </div>
          <ProgressRing score={comparison.progressScore || 50} />
        </div>

        {/* Carried Over Items */}
        {comparison.carriedOverItems?.length > 0 && (
          <div className="compare-section glass-card">
            <div className="card-header">
              <div className="card-icon" style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.15), transparent)' }}>
                <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>sync</span>
              </div>
              <h3 className="card-title">Carried Over Items <span className="card-count">{comparison.carriedOverItems.length}</span></h3>
            </div>
            <div className="diff-items-list">
              {comparison.carriedOverItems.map((item, i) => (
                <div key={i} className="diff-item">
                  <DiffTag type={item.status} />
                  <div className="diff-item-content">
                    <span className="diff-item-task">{item.task}</span>
                    <span className="diff-item-owner">→ {item.owner}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dropped Items */}
        {comparison.droppedItems?.length > 0 && (
          <div className="compare-section glass-card">
            <div className="card-header">
              <div className="card-icon" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), transparent)' }}>
                <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>remove_circle</span>
              </div>
              <h3 className="card-title">Dropped Items <span className="card-count">{comparison.droppedItems.length}</span></h3>
            </div>
            <div className="diff-items-list">
              {comparison.droppedItems.map((item, i) => (
                <div key={i} className="diff-item diff-item--dropped">
                  <DiffTag type="dropped" />
                  <div className="diff-item-content">
                    <span className="diff-item-task">{item.task}</span>
                    <span className="diff-item-owner">→ {item.owner}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Items */}
        {comparison.newItems?.length > 0 && (
          <div className="compare-section glass-card">
            <div className="card-header">
              <div className="card-icon" style={{ background: 'linear-gradient(135deg, rgba(217,70,239,0.15), transparent)' }}>
                <span className="material-symbols-outlined" style={{ color: '#D946EF' }}>add_circle</span>
              </div>
              <h3 className="card-title">New Items <span className="card-count">{comparison.newItems.length}</span></h3>
            </div>
            <div className="diff-items-list">
              {comparison.newItems.map((item, i) => (
                <div key={i} className="diff-item diff-item--new">
                  <DiffTag type="new" />
                  <div className="diff-item-content">
                    <span className="diff-item-task">{item.task}</span>
                    <span className="diff-item-owner">→ {item.owner}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revisited Decisions */}
        {comparison.revisitedDecisions?.length > 0 && (
          <div className="compare-section glass-card">
            <div className="card-header">
              <div className="card-icon" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.15), transparent)' }}>
                <span className="material-symbols-outlined" style={{ color: '#b45309' }}>history</span>
              </div>
              <h3 className="card-title">Revisited Decisions <span className="card-count">{comparison.revisitedDecisions.length}</span></h3>
            </div>
            <div className="diff-items-list">
              {comparison.revisitedDecisions.map((item, i) => (
                <div key={i} className="diff-item">
                  <DiffTag type="revisited" />
                  <div className="diff-item-content">
                    <span className="diff-item-task">{item.decision}</span>
                    <span className="diff-item-note">{item.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Repeated Assignees */}
        {comparison.repeatedAssignees?.length > 0 && (
          <div className="compare-section glass-card">
            <div className="card-header">
              <div className="card-icon" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), transparent)' }}>
                <span className="material-symbols-outlined" style={{ color: '#F97316' }}>person_pin</span>
              </div>
              <h3 className="card-title">Repeated Assignees <span className="card-count">{comparison.repeatedAssignees.length}</span></h3>
            </div>
            <div className="assignee-grid">
              {comparison.repeatedAssignees.map((person, i) => (
                <div key={i} className="assignee-card">
                  <div className="assignee-name">{person.name}</div>
                  <div className="assignee-counts">
                    <span className="assignee-count">
                      <span className="assignee-label">Meeting A</span>
                      <span className="assignee-num">{person.meetingAItems}</span>
                    </span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#94a3b8' }}>arrow_forward</span>
                    <span className="assignee-count">
                      <span className="assignee-label">Meeting B</span>
                      <span className="assignee-num">{person.meetingBItems}</span>
                    </span>
                  </div>
                  <p className="assignee-observation">{person.observation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="compare-view">
      <div className="view-header">
        <div>
          <h2 className="view-title text-gradient">Compare Meetings</h2>
          <p className="view-subtitle">Paste two transcripts to see what changed between meetings</p>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.15rem' }}>⚠️</span>
          <span className="error-text">{error}</span>
          <button className="error-dismiss" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="compare-inputs">
        <div className="compare-input-panel glass-card">
          <div className="compare-input-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="compare-meeting-label">
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#38bdf8' }}>looks_one</span>
              Meeting A (Earlier)
            </span>
            <button 
              onClick={() => toggleListen('A')}
              style={{
                background: listeningTo === 'A' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                border: '1px solid',
                borderColor: listeningTo === 'A' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: listeningTo === 'A' ? '#ef4444' : 'var(--text-secondary)',
                boxShadow: listeningTo === 'A' ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
              title={listeningTo === 'A' ? "Stop listening" : "Start dictation"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="1" width="6" height="11" rx="3" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" y1="18" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </div>
          <textarea
            className="transcript-textarea"
            placeholder="// Paste the first meeting transcript here..."
            value={transcriptA}
            onChange={(e) => setTranscriptA(e.target.value)}
            spellCheck={false}
          />
          <div className="compare-input-footer">
            <span className="awaiting-text">
              {transcriptA.length > 0 ? `${transcriptA.length.toLocaleString()} chars` : '// awaiting input'}
            </span>
          </div>
        </div>

        <div className="compare-divider">
          <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#F97316' }}>compare_arrows</span>
        </div>

        <div className="compare-input-panel glass-card">
          <div className="compare-input-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="compare-meeting-label">
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#D946EF' }}>looks_two</span>
              Meeting B (Later)
            </span>
            <button 
              onClick={() => toggleListen('B')}
              style={{
                background: listeningTo === 'B' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                border: '1px solid',
                borderColor: listeningTo === 'B' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: listeningTo === 'B' ? '#ef4444' : 'var(--text-secondary)',
                boxShadow: listeningTo === 'B' ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
              title={listeningTo === 'B' ? "Stop listening" : "Start dictation"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="1" width="6" height="11" rx="3" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" y1="18" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </div>
          <textarea
            className="transcript-textarea"
            placeholder="// Paste the second meeting transcript here..."
            value={transcriptB}
            onChange={(e) => setTranscriptB(e.target.value)}
            spellCheck={false}
          />
          <div className="compare-input-footer">
            <span className="awaiting-text">
              {transcriptB.length > 0 ? `${transcriptB.length.toLocaleString()} chars` : '// awaiting input'}
            </span>
          </div>
        </div>
      </div>

      <div className="compare-action-row">
        <button
          className="btn-cta"
          onClick={handleCompare}
          disabled={!transcriptA.trim() || !transcriptB.trim() || loading}
        >
          {loading ? (
            <>
              <span className="btn-spinner" />
              {loadingStage}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">compare_arrows</span>
              Compare Meetings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
