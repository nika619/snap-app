import { GoogleGenerativeAI } from "@google/generative-ai";

function getApiKey() {
  // Check localStorage first (set via Settings modal), then env variable
  const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('briefmind_api_key') : null;
  return storedKey || import.meta.env.VITE_GEMINI_API_KEY;
}

/* =========================================
   ERROR CLASSIFICATION
   ========================================= */
function classifyAndThrow(err) {
  const msg = (err?.message || '').toLowerCase();
  const status = err?.status || err?.httpStatus || err?.code;

  // Auth errors
  if (status === 401 || status === 403 || msg.includes('api key') || msg.includes('permission') || msg.includes('unauthorized') || msg.includes('forbidden')) {
    throw new Error('Your API key is invalid or expired. Please update it in Settings.');
  }

  // Rate limiting
  if (status === 429 || msg.includes('rate limit') || msg.includes('quota') || msg.includes('resource exhausted')) {
    throw new Error('API rate limit reached. Please wait a moment and try again.');
  }

  // Server errors
  if (status >= 500 || msg.includes('internal') || msg.includes('unavailable') || msg.includes('server error')) {
    throw new Error('Gemini service is temporarily unavailable. Please try again in a few minutes.');
  }

  // Network errors
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('timeout') || msg.includes('econnrefused') || msg.includes('failed to fetch') || err instanceof TypeError) {
    throw new Error('Network error. Check your internet connection and try again.');
  }

  // Unknown — pass through the original message
  throw new Error(err?.message || 'An unexpected error occurred. Please try again.');
}

/* =========================================
   LENIENT RESULT VALIDATION
   Coerce types instead of rejecting.
   ========================================= */
function safeNumber(val, fallback = 0) {
  const n = Number(val);
  return isNaN(n) ? fallback : Math.max(0, Math.min(100, Math.round(n)));
}

function safeString(val, fallback = '') {
  return typeof val === 'string' ? val : fallback;
}

function validateAnalysisResult(parsed) {
  // Must have a summary — this is the only hard requirement
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI returned an invalid response. Please try again.');
  }

  // Coerce summary
  parsed.summary = safeString(parsed.summary, '');
  if (!parsed.summary) {
    throw new Error('AI response was missing a summary. Please try again.');
  }

  // Coerce decisions
  if (!Array.isArray(parsed.decisions)) parsed.decisions = [];
  parsed.decisions = parsed.decisions.map(d => safeString(d)).filter(Boolean);

  // Coerce action items — lenient on individual items
  if (!Array.isArray(parsed.actionItems)) parsed.actionItems = [];
  parsed.actionItems = parsed.actionItems
    .filter(item => item && typeof item === 'object' && (item.task || item.description))
    .map(item => ({
      task: safeString(item.task || item.description, 'Untitled task'),
      owner: safeString(item.owner || item.assignee, 'Unassigned'),
      deadline: safeString(item.deadline || item.due || item.dueDate, 'TBD'),
      priority: ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
      completed: Boolean(item.completed),
    }));

  // Coerce follow-ups
  if (!Array.isArray(parsed.followUps)) parsed.followUps = [];
  parsed.followUps = parsed.followUps.map(f => safeString(f)).filter(Boolean);

  // Coerce email draft
  parsed.emailDraft = safeString(parsed.emailDraft, '');

  // Coerce health score — very lenient
  if (!parsed.healthScore || typeof parsed.healthScore !== 'object') {
    parsed.healthScore = { score: 0, clarity: 0, actionability: 0, participation: 0, verdict: 'Unable to assess' };
  } else {
    parsed.healthScore = {
      score: safeNumber(parsed.healthScore.score),
      clarity: safeNumber(parsed.healthScore.clarity),
      actionability: safeNumber(parsed.healthScore.actionability),
      participation: safeNumber(parsed.healthScore.participation),
      verdict: safeString(parsed.healthScore.verdict, 'Unable to assess'),
    };
  }

  // Coerce speaker stats
  if (!Array.isArray(parsed.speakerStats)) parsed.speakerStats = [];
  parsed.speakerStats = parsed.speakerStats
    .filter(s => s && typeof s === 'object' && s.name)
    .map(s => ({
      name: safeString(s.name, 'Unknown'),
      actionItems: safeNumber(s.actionItems),
      decisions: safeNumber(s.decisions),
      mentions: safeNumber(s.mentions),
      role: safeString(s.role, 'Participant'),
    }));

  return parsed;
}

function validateComparisonResult(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI returned an invalid comparison. Please try again.');
  }

  parsed.overallDiff = safeString(parsed.overallDiff, 'Unable to generate comparison summary.');
  parsed.progressScore = safeNumber(parsed.progressScore, 50);

  if (!Array.isArray(parsed.carriedOverItems)) parsed.carriedOverItems = [];
  if (!Array.isArray(parsed.droppedItems)) parsed.droppedItems = [];
  if (!Array.isArray(parsed.newItems)) parsed.newItems = [];
  if (!Array.isArray(parsed.revisitedDecisions)) parsed.revisitedDecisions = [];
  if (!Array.isArray(parsed.repeatedAssignees)) parsed.repeatedAssignees = [];

  return parsed;
}


const PROMPT_TEMPLATE = `You are a professional meeting analyst. Analyze the following meeting transcript and extract structured information.

Return ONLY a valid JSON object with exactly these keys:
{
  "summary": "A concise 2-3 sentence summary of what the meeting was about and the key outcomes.",
  "decisions": [
    "Decision 1 that was made",
    "Decision 2 that was made"
  ],
  "actionItems": [
    {
      "task": "Description of the action item",
      "owner": "Person responsible (use 'Unassigned' if unclear)",
      "deadline": "Due date or timeframe (use 'TBD' if not mentioned)",
      "priority": "high" | "medium" | "low"
    }
  ],
  "followUps": [
    "Follow-up item or question to address next"
  ],
  "emailDraft": "A professional follow-up email (2-3 paragraphs) summarizing the meeting, listing key decisions, action items with owners and deadlines, and next steps. Use a warm but professional tone. Start with 'Hi team,' and end with a sign-off.",
  "healthScore": {
    "score": 72,
    "clarity": 80,
    "actionability": 65,
    "participation": 70,
    "verdict": "One sentence assessment of overall meeting quality"
  },
  "speakerStats": [
    {
      "name": "Speaker Name",
      "actionItems": 2,
      "decisions": 1,
      "mentions": 5,
      "role": "Inferred role (e.g., 'Project Lead', 'Developer', 'Designer', 'Stakeholder')"
    }
  ]
}

Rules:
- Return ONLY the JSON object, no markdown, no explanation, no code fences.
- Every action item MUST have all four fields: task, owner, deadline, priority.
- Priority should be "high", "medium", or "low" based on urgency and importance.
- If no decisions were made, return an empty array for "decisions".
- If no follow-ups are needed, return an empty array for "followUps".
- Extract owner names exactly as mentioned in the transcript.
- Infer deadlines from context when possible (e.g., "by next Friday", "end of sprint").
- The emailDraft should be a complete, ready-to-send follow-up email.
- healthScore.score is 0-100 overall. clarity = how clear discussions were, actionability = how well action items were defined, participation = how balanced speaker contributions were. Each sub-score is 0-100.
- speakerStats should list every unique speaker/person mentioned. Count their action items (as owner), decisions they drove, and total mentions in the transcript. Infer their role from context.

MEETING TRANSCRIPT:
---
{TRANSCRIPT}
---

Return the JSON object now:`;

export async function analyzeTranscript(transcript) {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error("Please add your Gemini API key in Settings or in the .env file (VITE_GEMINI_API_KEY)");
  }

  let genAI, model;
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 8192,
      }
    });
  } catch (err) {
    classifyAndThrow(err);
  }

  const prompt = PROMPT_TEMPLATE.replace("{TRANSCRIPT}", transcript);

  let text;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    text = response.text();
  } catch (err) {
    classifyAndThrow(err);
  }

  // Strip markdown code fences if Gemini wraps the response
  text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini response:", text.substring(0, 500));
    throw new Error("AI returned malformed data. This sometimes happens — please try again.");
  }

  return validateAnalysisResult(parsed);
}


/* =========================================
   COMPARE TWO MEETINGS
   ========================================= */
const COMPARE_PROMPT = `You are a professional meeting analyst. You are given two meeting analyses (Meeting A and Meeting B, typically from recurring meetings). Compare them and identify patterns.

Return ONLY a valid JSON object with these keys:
{
  "carriedOverItems": [
    { "task": "Action item text", "owner": "Person", "status": "carried-over | completed | dropped" }
  ],
  "droppedItems": [
    { "task": "Action item from Meeting A not in Meeting B", "owner": "Person" }
  ],
  "newItems": [
    { "task": "New action item in Meeting B not in A", "owner": "Person" }
  ],
  "revisitedDecisions": [
    { "decision": "Decision text", "note": "Why it was revisited or how it changed" }
  ],
  "repeatedAssignees": [
    { "name": "Person", "meetingAItems": 3, "meetingBItems": 4, "observation": "Brief observation about workload" }
  ],
  "overallDiff": "A 2-3 sentence summary of how Meeting B compares to Meeting A. Are things progressing? Are the same issues recurring?",
  "progressScore": 75
}

Rules:
- Return ONLY the JSON object, no markdown, no explanation, no code fences.
- carriedOverItems: action items from Meeting A that appear (same or similar) in Meeting B
- droppedItems: action items from Meeting A that don't appear in Meeting B and weren't completed
- newItems: action items in Meeting B that are completely new
- revisitedDecisions: decisions from Meeting A that were discussed again in Meeting B
- repeatedAssignees: people who have action items in both meetings
- progressScore: 0-100, how much progress was made between meetings (100 = all items resolved, new productive items added)

MEETING A ANALYSIS:
---
{MEETING_A}
---

MEETING B ANALYSIS:
---
{MEETING_B}
---

Return the JSON object now:`;

export async function compareMeetings(meetingA, meetingB) {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error("Please add your Gemini API key in Settings");
  }

  let genAI, model;
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 8192,
      }
    });
  } catch (err) {
    classifyAndThrow(err);
  }

  const prompt = COMPARE_PROMPT
    .replace("{MEETING_A}", JSON.stringify(meetingA))
    .replace("{MEETING_B}", JSON.stringify(meetingB));

  let text;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    text = response.text();
  } catch (err) {
    classifyAndThrow(err);
  }

  text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse comparison response:", text.substring(0, 500));
    throw new Error("AI returned malformed comparison data. Please try again.");
  }

  return validateComparisonResult(parsed);
}
