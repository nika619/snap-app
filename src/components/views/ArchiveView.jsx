import { useState } from 'react';
import ResultCards from '../ui/ResultCards';
import { getHistory, saveHistory, clearHistory } from '../../services/storage';

export default function ArchiveView({ onLoadAnalysis }) {
  const [history, setHistory] = useState(() => getHistory());
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleClear = () => {
    clearHistory();
    setHistory([]);
    setSelectedIndex(null);
  };

  const handleDelete = (index) => {
    const filtered = filteredHistory();
    const actualIndex = history.indexOf(filtered[index]);
    const updated = history.filter((_, i) => i !== actualIndex);
    saveHistory(updated);
    setHistory(updated);
    if (selectedIndex === index) setSelectedIndex(null);
    else if (selectedIndex > index) setSelectedIndex(selectedIndex - 1);
  };

  const filteredHistory = () => {
    if (!searchQuery.trim()) return history;
    const q = searchQuery.toLowerCase();
    return history.filter(entry =>
      entry.preview?.toLowerCase().includes(q) ||
      entry.result?.summary?.toLowerCase().includes(q) ||
      entry.result?.actionItems?.some(item => item.task.toLowerCase().includes(q) || item.owner.toLowerCase().includes(q))
    );
  };

  const filtered = filteredHistory();

  if (selectedIndex !== null && filtered[selectedIndex]) {
    return (
      <div className="archive-view">
        <button className="btn-ghost archive-back-btn" onClick={() => setSelectedIndex(null)}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
          Back to Archive
        </button>
        <ResultCards result={filtered[selectedIndex].result} onReset={() => setSelectedIndex(null)} />
      </div>
    );
  }

  return (
    <div className="archive-view">
      <div className="view-header">
        <div>
          <h2 className="view-title text-gradient">Archive</h2>
          <p className="view-subtitle">{history.length} past {history.length === 1 ? 'analysis' : 'analyses'}</p>
        </div>
        {history.length > 0 && (
          <button className="btn-ghost" onClick={handleClear}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete_sweep</span>
            Clear All
          </button>
        )}
      </div>

      {/* Search */}
      {history.length > 0 && (
        <div className="archive-search">
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#94a3b8' }}>search</span>
          <input
            className="archive-search-input"
            placeholder="Search meetings, action items, owners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state glass-card">
          <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4 }}>inventory_2</span>
          <h3>{searchQuery ? 'No matches found' : 'No analyses yet'}</h3>
          <p>{searchQuery ? 'Try a different search term.' : 'Completed analyses will appear here for future reference.'}</p>
        </div>
      ) : (
        <div className="archive-list">
          {filtered.map((entry, i) => (
            <div key={i} className="glass-card archive-card" onClick={() => setSelectedIndex(i)}>
              <div className="archive-card-content">
                <div className="archive-card-header">
                  <span className="material-symbols-outlined" style={{ color: '#F97316' }}>description</span>
                  <span className="archive-date">
                    {new Date(entry.timestamp).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  {entry.result?.healthScore?.score > 0 && (
                    <span className="results-pill" style={{
                      background: entry.result.healthScore.score >= 70 ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                      color: entry.result.healthScore.score >= 70 ? '#34d399' : '#b45309',
                      marginLeft: 'auto'
                    }}>
                      Health {entry.result.healthScore.score}
                    </span>
                  )}
                </div>
                <p className="archive-preview">{entry.preview}</p>
                <div className="archive-stats">
                  {entry.result.actionItems?.length > 0 && (
                    <span className="results-pill results-pill--actions">
                      {entry.result.actionItems.length} actions
                    </span>
                  )}
                  {entry.result.decisions?.length > 0 && (
                    <span className="results-pill" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
                      {entry.result.decisions.length} decisions
                    </span>
                  )}
                  {entry.result.speakerStats?.length > 0 && (
                    <span className="results-pill" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                      {entry.result.speakerStats.length} speakers
                    </span>
                  )}
                </div>
              </div>
              <div className="archive-card-actions">
                <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleDelete(i); }}
                  title="Delete">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
