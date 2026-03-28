/* =====================================================
   STORAGE.JS — API-key-namespaced localStorage + export/import
   ===================================================== */

/**
 * Simple hash of an API key to create a namespace.
 * Uses a fast non-crypto hash (djb2) — this is NOT for security, just namespacing.
 */
function hashKey(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'bm_' + Math.abs(hash).toString(36);
}

function getNamespace() {
  const key = localStorage.getItem('briefmind_api_key');
  if (!key) return 'briefmind'; // fallback default namespace
  return hashKey(key);
}

// ---- Namespaced history ----

export function getHistory() {
  const ns = getNamespace();
  try {
    return JSON.parse(localStorage.getItem(`${ns}_history`) || '[]');
  } catch { return []; }
}

export function saveHistory(history) {
  const ns = getNamespace();
  // Keep max 50 entries
  if (history.length > 50) history.length = 50;
  localStorage.setItem(`${ns}_history`, JSON.stringify(history));
}

export function clearHistory() {
  const ns = getNamespace();
  localStorage.removeItem(`${ns}_history`);
}

// ---- Namespaced action item edits ----

export function getEditedItems() {
  const ns = getNamespace();
  try {
    return JSON.parse(localStorage.getItem(`${ns}_edited_items`) || '{}');
  } catch { return {}; }
}

export function saveEditedItems(edits) {
  const ns = getNamespace();
  localStorage.setItem(`${ns}_edited_items`, JSON.stringify(edits));
}

// ---- Migration: move old 'briefmind_history' into namespaced storage ----

export function migrateOldData() {
  const oldHistory = localStorage.getItem('briefmind_history');
  if (oldHistory) {
    const ns = getNamespace();
    // Only migrate if new namespace storage is empty
    if (!localStorage.getItem(`${ns}_history`)) {
      localStorage.setItem(`${ns}_history`, oldHistory);
    }
    // Keep old data as backup, but flag it as migrated
    localStorage.setItem('briefmind_history_migrated', 'true');
  }
}

// ---- Export / Import for cross-device sync ----

export function exportAllData() {
  const ns = getNamespace();
  const data = {
    version: 1,
    exported: Date.now(),
    history: getHistory(),
    editedItems: getEditedItems(),
  };
  return JSON.stringify(data);
}

export function importAllData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.version !== 1) throw new Error('Unsupported data version');
    
    const ns = getNamespace();
    if (data.history) {
      // Merge: imported data + existing, deduplicated by timestamp
      const existing = getHistory();
      const existingTimestamps = new Set(existing.map(e => e.timestamp));
      const newEntries = data.history.filter(e => !existingTimestamps.has(e.timestamp));
      const merged = [...newEntries, ...existing].sort((a, b) => b.timestamp - a.timestamp);
      if (merged.length > 50) merged.length = 50;
      saveHistory(merged);
    }
    if (data.editedItems) {
      const existing = getEditedItems();
      saveEditedItems({ ...data.editedItems, ...existing });
    }
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}
