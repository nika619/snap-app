import { useState, useEffect, useRef } from 'react';
import TiltCard from './TiltCard';

const MIN_TRANSCRIPT_LENGTH = 50;

export default function TranscriptInput({ transcript, setTranscript, onAnalyze, loading }) {
  const len = transcript.trim().length;
  const isEmpty = len === 0;
  const isTooShort = len > 0 && len < MIN_TRANSCRIPT_LENGTH;
  const isValid = len >= MIN_TRANSCRIPT_LENGTH;

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

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
          setTranscript(prev => (prev + ' ' + finalTranscript).trim());
        }
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone permission in your browser settings.');
        }
      };

      recognitionRef.current = recognition;
    }
  }, [setTranscript]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        alert("Your browser does not support Speech Recognition. Try using Chrome or Edge.");
        return;
      }
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Speech recognition error:", err);
        alert("Could not start voice input. Error: " + err.message);
      }
    }
  };


  return (
    <>
      {/* Main Input Card — Stitch glass card exact match */}
      <section className="input-section">
        <div className="glass-card input-card">
          <div className="input-card-inner">
            <div className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="material-symbols-outlined">content_paste</span>
                <span>Paste or Speak Your Meeting Transcript</span>
              </div>
              <button 
                onClick={toggleListen}
                style={{
                  background: isListening ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  border: '1px solid',
                  borderColor: isListening ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isListening ? '#ef4444' : 'var(--text-secondary)',
                  boxShadow: isListening ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                title={isListening ? "Stop listening" : "Start dictation"}
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
              placeholder={'// Paste transcript here...\n// Let S.N.A.P. identify speakers, action items, and key decisions.'}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              spellCheck={false}
            />
          </div>
          <div className="input-footer">
            <div className="input-footer-left">
              <div className={`awaiting-text ${isEmpty ? '' : isTooShort ? 'awaiting-text--warn' : 'awaiting-text--valid'}`}>
                {isEmpty
                  ? '// awaiting input'
                  : `${len.toLocaleString()} characters`}
              </div>
              {isTooShort && (
                <div className="transcript-hint">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>info</span>
                  Paste at least {MIN_TRANSCRIPT_LENGTH} characters for meaningful analysis
                </div>
              )}
            </div>
            <button
              className="btn-cta"
              onClick={onAnalyze}
              disabled={!isValid || loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  Processing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">edit_note</span>
                  Analyze Meeting
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Process Row — Stitch step cards with 3D tilt */}
      <section className="steps-row">
        <TiltCard className="glass-card step-card" glowColor="#F97316">
          <span className="step-number">01</span>
          <div className="step-icon-wrap">
            <span className="material-symbols-outlined">note_add</span>
          </div>
          <h3 className="step-title">Paste</h3>
          <p className="step-desc">Drop your transcript or meeting notes from any platform.</p>
          <div className="step-glow" />
        </TiltCard>

        <TiltCard className="glass-card step-card" glowColor="#EAB308">
          <span className="step-number">02</span>
          <div className="step-icon-wrap">
            <span className="material-symbols-outlined">psychology</span>
          </div>
          <h3 className="step-title">AI Processes</h3>
          <p className="step-desc">Gemini 2.5 Flash extracts structure, semantic meaning, and tone.</p>
          <div className="step-glow" />
        </TiltCard>

        <TiltCard className="glass-card step-card" glowColor="#D946EF">
          <span className="step-number">03</span>
          <div className="step-icon-wrap">
            <span className="material-symbols-outlined">speed</span>
          </div>
          <h3 className="step-title">Get Brief</h3>
          <p className="step-desc">Decisions, actions, and owners delivered in seconds.</p>
          <div className="step-glow" />
        </TiltCard>
      </section>
    </>
  );
}
