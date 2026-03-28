/**
 * Google Calendar URL Integration
 * Opens pre-filled Google Calendar event creation forms.
 * No OAuth required — uses the public URL scheme.
 */

/**
 * Parse a human-readable deadline string into a Date object.
 * Handles: "March 30", "next Friday", "end of sprint", "3/30/2026", "TBD", etc.
 */
export function parseDeadlineToDate(deadline) {
  if (!deadline || deadline.toLowerCase() === 'tbd' || deadline.toLowerCase() === 'n/a') {
    // Default to tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  }

  // Try native Date parsing first (handles "March 30, 2026", "2026-03-30", "3/30/2026")
  const parsed = new Date(deadline);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2024) {
    parsed.setHours(9, 0, 0, 0);
    return parsed;
  }

  // Handle relative terms
  const lower = deadline.toLowerCase();
  const now = new Date();

  if (lower.includes('today')) {
    now.setHours(9, 0, 0, 0);
    return now;
  }
  if (lower.includes('tomorrow')) {
    now.setDate(now.getDate() + 1);
    now.setHours(9, 0, 0, 0);
    return now;
  }
  if (lower.includes('next week')) {
    now.setDate(now.getDate() + 7);
    now.setHours(9, 0, 0, 0);
    return now;
  }
  if (lower.includes('end of week') || lower.includes('this friday') || lower.includes('next friday')) {
    const dayOfWeek = now.getDay();
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - (dayOfWeek - 5);
    now.setDate(now.getDate() + (daysUntilFriday || 7));
    now.setHours(9, 0, 0, 0);
    return now;
  }
  if (lower.includes('end of sprint') || lower.includes('end of month')) {
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(9, 0, 0, 0);
    return endOfMonth;
  }

  // Try parsing month + day without year (e.g., "March 30")
  const monthDay = new Date(`${deadline}, ${now.getFullYear()}`);
  if (!isNaN(monthDay.getTime())) {
    monthDay.setHours(9, 0, 0, 0);
    // If the date has passed, assume next year
    if (monthDay < now) monthDay.setFullYear(monthDay.getFullYear() + 1);
    return monthDay;
  }

  // Fallback: tomorrow
  now.setDate(now.getDate() + 1);
  now.setHours(9, 0, 0, 0);
  return now;
}

/**
 * Format a Date into the Google Calendar URL date format: YYYYMMDDTHHmmssZ
 */
function formatGCalDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Create a Google Calendar event URL.
 * @param {string} title - Event title
 * @param {string} description - Event description/details
 * @param {Date} startDate - Event start date
 * @param {number} durationMinutes - Duration in minutes (default 60)
 * @returns {string} Google Calendar URL
 */
export function createCalendarEventUrl({ title, description = '', startDate, durationMinutes = 60 }) {
  const start = new Date(startDate);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatGCalDate(start)}/${formatGCalDate(end)}`,
    details: description,
    sf: 'true',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Create a calendar event from an action item.
 */
export function createActionItemEvent(item) {
  const startDate = parseDeadlineToDate(item.deadline);
  const priorityEmoji = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';

  return createCalendarEventUrl({
    title: `${priorityEmoji} ${item.task}`,
    description: [
      `📋 Action Item from S.N.A.P.`,
      ``,
      `Owner: ${item.owner}`,
      `Priority: ${item.priority.toUpperCase()}`,
      `Deadline: ${item.deadline}`,
      ``,
      `Task: ${item.task}`,
    ].join('\n'),
    startDate,
    durationMinutes: 60,
  });
}

/**
 * Create a quick reminder event (15 min, later today or tomorrow morning).
 */
export function createReminderUrl(item) {
  const now = new Date();
  let start;
  // If before 6pm, set reminder 1 hour from now; otherwise tomorrow 9am
  if (now.getHours() < 18) {
    start = new Date(now.getTime() + 60 * 60 * 1000);
  } else {
    start = new Date(now);
    start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);
  }

  return createCalendarEventUrl({
    title: `⏰ Reminder: ${item.task || item}`,
    description: `Set from S.N.A.P.\nOwner: ${item.owner || 'You'}\n\n${item.task || item}`,
    startDate: start,
    durationMinutes: 15,
  });
}

/**
 * Create a follow-up meeting event.
 */
export function createFollowUpEvent(followUpText) {
  const start = new Date();
  start.setDate(start.getDate() + 2); // Default: 2 days from now
  start.setHours(10, 0, 0, 0);

  return createCalendarEventUrl({
    title: `🔄 Follow-up: ${followUpText.substring(0, 60)}`,
    description: `Follow-up from S.N.A.P. meeting analysis:\n\n${followUpText}`,
    startDate: start,
    durationMinutes: 30,
  });
}

/**
 * Open a URL in a new tab.
 */
export function openCalendarEvent(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}
