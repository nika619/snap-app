import { useState, useRef } from 'react';
import { exportAllData, importAllData, migrateOldData, getHistory } from '../../services/storage';

export default function SettingsModal({ onClose }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('briefmind_api_key') || '');
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('briefmind_webhook_url') || '');
  const [saved, setSaved] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('briefmind_api_key', apiKey.trim());
      migrateOldData(); // migrate old data into new namespace
    } else {
      localStorage.removeItem('briefmind_api_key');
    }

    if (webhookUrl.trim()) {
      localStorage.setItem('briefmind_webhook_url', webhookUrl.trim());
    } else {
      localStorage.removeItem('briefmind_webhook_url');
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    localStorage.removeItem('briefmind_api_key');
    localStorage.removeItem('briefmind_webhook_url');
    setApiKey('');
    setWebhookUrl('');
    setSaved(false);
  };

  const handleExportFile = () => {
    const data = exportAllData();
    const date = new Date().toISOString().split('T')[0];
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briefmind-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setImportStatus('✅ Backup downloaded!');
    setTimeout(() => setImportStatus(''), 3000);
  };

  const handleExportClipboard = async () => {
    const data = exportAllData();
    try {
      await navigator.clipboard.writeText(data);
      setImportStatus('✅ Data copied to clipboard!');
    } catch {
      setImportStatus('❌ Clipboard copy failed. Use the Download button instead.');
    }
    setTimeout(() => setImportStatus(''), 3000);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setImportStatus('❌ Please select a .json file.');
      setTimeout(() => setImportStatus(''), 3000);
      return;
    }

    setImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        // Quick sanity check before importing
        const preview = JSON.parse(text);
        const entryCount = preview.history?.length || 0;

        const confirmed = confirm(`Import ${entryCount} meeting${entryCount !== 1 ? 's' : ''} from backup? This will merge with your existing data.`);
        if (!confirmed) {
          setImporting(false);
          return;
        }

        const success = importAllData(text);
        setImportStatus(success
          ? `✅ Successfully imported ${entryCount} meeting${entryCount !== 1 ? 's' : ''}! Refresh to see changes.`
          : '❌ Import failed. The file may be corrupted or in an unsupported format.'
        );
      } catch (err) {
        setImportStatus('❌ Import failed. Invalid JSON file.');
      } finally {
        setImporting(false);
        // Reset the file input so the same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      setTimeout(() => setImportStatus(''), 5000);
    };
    reader.onerror = () => {
      setImportStatus('❌ Failed to read file.');
      setImporting(false);
      setTimeout(() => setImportStatus(''), 3000);
    };
    reader.readAsText(file);
  };

  // Get a quick count for the export info
  let entryCount = 0;
  try { entryCount = getHistory().length; } catch { /* ignore */ }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="view-title text-gradient">Settings</h2>
          <button className="btn-icon modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="settings-section">
          <label className="settings-label">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#F97316' }}>key</span>
            Gemini API Key
          </label>
          <p className="settings-help">
            Enter your Google Gemini API key. Your data is stored locally, scoped to your key.
          </p>
          <div className="settings-input-row">
            <input
              type="password"
              className="settings-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key here..."
            />
          </div>

          <label className="settings-label" style={{ marginTop: '1.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#D946EF' }}>webhook</span>
            Automation Webhook (n8n / Relay.app)
          </label>
          <p className="settings-help">
            Enter your webhook URL to automatically push meeting results to n8n, Relay.app, or Zapier workflows.
          </p>
          <div className="settings-input-row">
            <input
              type="text"
              className="settings-input"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-webhook-url.com/hook/..."
            />
          </div>
          <div className="settings-actions">
            <button className="btn-cta" onClick={handleSave}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>save</span>
              {saved ? 'Saved!' : 'Save Key'}
            </button>
            <button className="btn-ghost" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>

        <div className="settings-section">
          <label className="settings-label">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#38bdf8' }}>sync</span>
            Data Backup & Restore
          </label>
          <p className="settings-help">
            {entryCount > 0
              ? `You have ${entryCount} meeting${entryCount !== 1 ? 's' : ''} saved. Export to back up, or import a previous backup.`
              : 'No meetings saved yet. After analyzing meetings, you can export them as a backup file.'}
          </p>
          <div className="settings-actions">
            <button className="btn-secondary" onClick={handleExportFile} disabled={entryCount === 0}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
              Download Backup
            </button>
            <button className="btn-secondary" onClick={handleExportClipboard} disabled={entryCount === 0}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
              Copy to Clipboard
            </button>
          </div>
          <div className="settings-import-section">
            <label className="settings-import-label">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="settings-import-input"
                disabled={importing}
              />
              <span className="settings-import-btn">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload_file</span>
                {importing ? 'Importing...' : 'Import from File'}
              </span>
            </label>
          </div>
          {importStatus && (
            <p className="settings-help" style={{ marginTop: '0.75rem', color: importStatus.startsWith('✅') ? '#34d399' : '#ef4444' }}>
              {importStatus}
            </p>
          )}
        </div>

        <div className="settings-section">
          <label className="settings-label">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#d97706' }}>info</span>
            About
          </label>
          <p className="settings-help">
            S.N.A.P. v5.0.0 · Powered by Gemini 2.5 Flash
          </p>
        </div>
      </div>
    </div>
  );
}
