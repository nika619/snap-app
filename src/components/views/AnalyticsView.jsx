import React, { useState, useEffect, useMemo } from 'react';
import { getHistory } from '../../services/storage';

export default function AnalyticsView() {
  const history = getHistory();

  const totalMeetings = history.length;
  const totalActions = history.reduce((sum, e) => sum + (e.result.actionItems?.length || 0), 0);
  const totalDecisions = history.reduce((sum, e) => sum + (e.result.decisions?.length || 0), 0);
  const totalFollowUps = history.reduce((sum, e) => sum + (e.result.followUps?.length || 0), 0);
  const highPriority = history.reduce(
    (sum, e) => sum + (e.result.actionItems?.filter(i => i.priority === 'high').length || 0), 0
  );
  const avgHealthScore = history.length > 0
    ? Math.round(history.reduce((sum, e) => sum + (e.result.healthScore?.score || 0), 0) / history.length)
    : 0;

  // Find top owners
  const ownerMap = {};
  history.forEach(e => {
    (e.result.actionItems || []).forEach(item => {
      const owner = item.owner || 'Unassigned';
      ownerMap[owner] = (ownerMap[owner] || 0) + 1;
    });
  });
  const topOwners = Object.entries(ownerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Aggregate speaker stats across all meetings
  const speakerAgg = {};
  history.forEach(e => {
    (e.result.speakerStats || []).forEach(s => {
      if (!speakerAgg[s.name]) {
        speakerAgg[s.name] = { name: s.name, role: s.role, actionItems: 0, decisions: 0, mentions: 0, meetings: 0 };
      }
      speakerAgg[s.name].actionItems += s.actionItems || 0;
      speakerAgg[s.name].decisions += s.decisions || 0;
      speakerAgg[s.name].mentions += s.mentions || 0;
      speakerAgg[s.name].meetings += 1;
    });
  });
  const topSpeakers = Object.values(speakerAgg).sort((a, b) => b.mentions - a.mentions).slice(0, 8);
  const maxSpeakerMentions = Math.max(...topSpeakers.map(s => s.mentions), 1);

  const stats = [
    { label: 'Meetings Analyzed', value: totalMeetings, icon: 'groups', color: '#F97316' },
    { label: 'Action Items', value: totalActions, icon: 'target', color: '#d97706' },
    { label: 'Decisions Made', value: totalDecisions, icon: 'check_circle', color: '#34d399' },
    { label: 'Follow-ups', value: totalFollowUps, icon: 'trending_flat', color: '#38bdf8' },
    { label: 'High Priority', value: highPriority, icon: 'priority_high', color: '#ef4444' },
    { label: 'Avg Health Score', value: avgHealthScore || '—', icon: 'monitor_heart', color: '#D946EF' },
  ];

  return (
    <div className="analytics-view">
      <div className="view-header">
        <div>
          <h2 className="view-title text-gradient">Analytics</h2>
          <p className="view-subtitle">Insights from your meeting history</p>
        </div>
      </div>

      {totalMeetings === 0 ? (
        <div className="empty-state glass-card">
          <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4 }}>insights</span>
          <h3>No data yet</h3>
          <p>Analyze meetings to see your analytics dashboard.</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="glass-card stat-card">
                <div className="stat-icon" style={{
                  background: `linear-gradient(135deg, ${stat.color}22, ${stat.color}11)`,
                  boxShadow: `0 0 15px ${stat.color}15`
                }}>
                  <span className="material-symbols-outlined" style={{ color: stat.color }}>{stat.icon}</span>
                </div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          {topOwners.length > 0 && (
            <div className="glass-card top-owners-card">
              <div className="card-header">
                <div className="card-icon" style={{
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.1))'
                }}>
                  <span className="material-symbols-outlined" style={{ color: '#F97316' }}>leaderboard</span>
                </div>
                <h3 className="card-title">Top Action Owners</h3>
              </div>
              <div className="owners-list">
                {topOwners.map(([name, count], i) => (
                  <div key={i} className="owner-row">
                    <div className="owner-info">
                      <span className="owner-rank">#{i + 1}</span>
                      <span className="owner-name">{name}</span>
                    </div>
                    <div className="owner-bar-wrap">
                      <div className="owner-bar" style={{
                        width: `${(count / topOwners[0][1]) * 100}%`,
                        background: `linear-gradient(90deg, #F97316, #d97706)`
                      }} />
                    </div>
                    <span className="owner-count">{count} items</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Speaker Analytics Aggregate */}
          {topSpeakers.length > 0 && (
            <div className="glass-card top-owners-card" style={{ marginTop: '1.5rem' }}>
              <div className="card-header">
                <div className="card-icon" style={{
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(56, 189, 248, 0.1))'
                }}>
                  <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>groups</span>
                </div>
                <h3 className="card-title">Speaker Insights (All Meetings)</h3>
              </div>
              <div className="speaker-stats-list">
                {topSpeakers.map((speaker, i) => (
                  <div key={i} className="speaker-stat-row">
                    <div className="speaker-info">
                      <span className="speaker-name">{speaker.name}</span>
                      <span className="speaker-role">{speaker.role} · {speaker.meetings} meetings</span>
                    </div>
                    <div className="speaker-bar-wrap">
                      <div className="speaker-bar" style={{
                        width: `${(speaker.mentions / maxSpeakerMentions) * 100}%`,
                        background: `linear-gradient(90deg, #38bdf8, #D946EF)`
                      }} />
                    </div>
                    <div className="speaker-chips">
                      <span className="speaker-chip">{speaker.actionItems} tasks</span>
                      <span className="speaker-chip">{speaker.decisions} decisions</span>
                      <span className="speaker-chip">{speaker.mentions} mentions</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
