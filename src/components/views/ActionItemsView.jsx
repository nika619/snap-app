import {
  createActionItemEvent,
  createReminderUrl,
  openCalendarEvent
} from '../../services/calendar';
import { getHistory } from '../../services/storage';
import { useState } from 'react';

export default function ActionItemsView() {
  const history = getHistory();

  // Aggregate all action items across all analyses
  const allItems = history.flatMap((entry, histIdx) =>
    (entry.result.actionItems || []).map(item => ({
      ...item,
      meetingDate: new Date(entry.timestamp).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric'
      }),
      histIdx
    }))
  );

  const [filter, setFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('');

  // Get unique owners
  const owners = [...new Set(allItems.map(i => i.owner))].sort();

  // Filter items
  let filteredItems = allItems;
  if (filter !== 'all') filteredItems = filteredItems.filter(i => i.priority === filter);
  if (ownerFilter) filteredItems = filteredItems.filter(i => i.owner === ownerFilter);

  const highItems = filteredItems.filter(i => i.priority === 'high');
  const mediumItems = filteredItems.filter(i => i.priority === 'medium');
  const lowItems = filteredItems.filter(i => i.priority === 'low');

  const renderGroup = (title, items, color, icon) => {
    if (items.length === 0) return null;
    return (
      <div className="action-group">
        <h3 className="action-group-title" style={{ color }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
          {title}
          <span className="card-count">{items.length}</span>
        </h3>
        <div className="action-items-list">
          {items.map((item, i) => (
            <div key={i} className={`action-item priority-${item.priority} ${item.completed ? 'action-item--completed' : ''}`}>
              <div>
                <div className={`action-item-task ${item.completed ? 'action-item-task--done' : ''}`}>{item.task}</div>
                <div className="action-item-meta">
                  <span className="meta-chip owner">
                    <span className="material-symbols-outlined">person</span>
                    {item.owner}
                  </span>
                  <span className="meta-chip deadline">
                    <span className="material-symbols-outlined">calendar_today</span>
                    {item.deadline}
                  </span>
                  <span className="meta-chip" style={{ opacity: 0.5 }}>
                    <span className="material-symbols-outlined">event</span>
                    {item.meetingDate}
                  </span>
                </div>
              </div>
              <div className="action-item-actions">
                <button
                  className="cal-action-btn"
                  title="Add to Google Calendar"
                  onClick={() => openCalendarEvent(createActionItemEvent(item))}
                >
                  <span className="material-symbols-outlined">calendar_add_on</span>
                  Calendar
                </button>
                <button
                  className="cal-action-btn cal-action-btn--remind"
                  title="Set a quick reminder"
                  onClick={() => openCalendarEvent(createReminderUrl(item))}
                >
                  <span className="material-symbols-outlined">alarm</span>
                  Remind
                </button>
                <span className={`priority-badge ${item.priority}`}>
                  {item.priority === 'high' ? 'HIGH' : item.priority === 'medium' ? 'MEDIUM' : 'LOW'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="action-items-view">
      <div className="view-header">
        <div>
          <h2 className="view-title text-gradient">Action Items</h2>
          <p className="view-subtitle">{allItems.length} items across {history.length} {history.length === 1 ? 'meeting' : 'meetings'}</p>
        </div>
      </div>

      {/* Filters */}
      {allItems.length > 0 && (
        <div className="action-filters">
          <div className="filter-group">
            <button className={`filter-btn ${filter === 'all' ? 'filter-btn--active' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`filter-btn ${filter === 'high' ? 'filter-btn--active' : ''}`} onClick={() => setFilter('high')} style={{ '--filter-color': '#ef4444' }}>
              🔴 High
            </button>
            <button className={`filter-btn ${filter === 'medium' ? 'filter-btn--active' : ''}`} onClick={() => setFilter('medium')} style={{ '--filter-color': '#b45309' }}>
              🟡 Medium
            </button>
            <button className={`filter-btn ${filter === 'low' ? 'filter-btn--active' : ''}`} onClick={() => setFilter('low')} style={{ '--filter-color': '#22c55e' }}>
              🟢 Low
            </button>
          </div>
          {owners.length > 1 && (
            <select className="action-edit-select" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}
              style={{ minWidth: '140px' }}>
              <option value="">All Owners</option>
              {owners.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
        </div>
      )}

      {allItems.length === 0 ? (
        <div className="empty-state glass-card">
          <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4 }}>playlist_add_check</span>
          <h3>No action items yet</h3>
          <p>Analyze a meeting to start tracking action items.</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state glass-card">
          <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4 }}>filter_list_off</span>
          <h3>No items match filters</h3>
          <p>Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="action-groups-container">
          {renderGroup('High Priority', highItems, '#ef4444', 'priority_high')}
          {renderGroup('Medium Priority', mediumItems, '#b45309', 'remove')}
          {renderGroup('Low Priority', lowItems, '#22c55e', 'low_priority')}
        </div>
      )}
    </div>
  );
}
