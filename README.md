<div align="center">

# ⚡ S.N.A.P.

[![CI](https://github.com/nika619/snap-app/actions/workflows/ci.yml/badge.svg)](https://github.com/nika619/snap-app/actions/workflows/ci.yml)

### **S**emantic **N**otes & **A**ction **P**rocessor

*Turn messy meeting chaos into crystal-clear action plans — in seconds.*

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-snap--app-blue?style=for-the-badge)](https://snap-app-491619.uc.r.appspot.com)
[![Built With](https://img.shields.io/badge/Built_With-React_+_Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![AI Engine](https://img.shields.io/badge/AI_Engine-Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)
[![Deployed On](https://img.shields.io/badge/Deployed_On-Google_Cloud-4285F4?style=for-the-badge&logo=googlecloud)](https://cloud.google.com)

<br/>

<img src="https://img.shields.io/badge/Hackathon_Track-Productivity_%26_Workflows-F97316?style=flat-square" />
<img src="https://img.shields.io/badge/Sponsor_Tool-n8n_%7C_Relay.app-6C47FF?style=flat-square" />
<img src="https://img.shields.io/badge/Status-Submitted-34d399?style=flat-square" />

</div>

---

## 🎯 The Problem

Every day, millions of meetings produce hours of unstructured conversation — but only a fraction of decisions, tasks, and deadlines actually get captured. Teams leave meetings without clear ownership, forgotten action items pile up, and follow-up emails never get sent. The gap between *talking about work* and *doing the work* is massive.

## 💡 The Solution

**S.N.A.P.** bridges that gap. Paste (or dictate) your raw meeting transcript, and our AI engine instantly extracts:

- ✅ **Structured action items** with owners, deadlines, and priority levels
- 📌 **Key decisions** made during the meeting
- 📊 **Meeting health scores** measuring clarity, actionability, and participation
- 📧 **Ready-to-send follow-up emails** — one click to Gmail
- 🔄 **Week-over-week comparison** to track if your team is actually making progress

Then it **pushes those insights directly into your workflow** — Google Calendar, Slack, Notion, n8n, or Relay.app — so nothing falls through the cracks.

---

## ✨ Features

### 🧠 AI-Powered Analysis Engine
Drop any raw meeting transcript and get back structured intelligence in seconds. The Gemini 2.5 Flash model extracts summaries, action items with inferred owners and deadlines, decisions, follow-ups, and a complete draft follow-up email.

### 🎙️ Voice Dictation
Can't paste? Just talk. Click the microphone button and dictate your meeting notes directly using the browser's native Speech-to-Text API. Works in real-time with visual feedback.

### 📊 Meeting Health Score
Every meeting gets a 0–100 quality score across three dimensions: **Clarity** (were topics well-defined?), **Actionability** (did it produce real tasks?), and **Participation** (was it balanced?). Plus a one-sentence AI verdict.

### ⚖️ Meeting Comparison
A split-screen diff tool for recurring meetings. See exactly which action items were *carried over*, *dropped*, or are *new*. Get a progress score showing if your team is resolving issues week over week.

### 🔌 Webhook Automation Engine *(Sponsor Integration)*
Connect S.N.A.P. to **n8n** or **Relay.app** with a single webhook URL. Click "Send to Workflow" and beam your structured meeting data to any automation pipeline — auto-create Jira tickets, send Slack digests, update spreadsheets, anything.

### 📅 Google Calendar Integration
Push action items and follow-up reminders directly to Google Calendar with pre-filled titles, descriptions, owners, and deadlines. One click, zero friction.

### 📤 Multi-Platform Export
One-click export perfectly formatted for:
- **Slack** — Markdown blocks with emoji formatting
- **Notion** — Clean heading/bullet structure
- **JSON** — Raw structured data for developers
- **Clipboard** — Plain text, ready to paste anywhere

### 🗄️ Local-First Privacy
Zero backend. Zero databases. Your API key and all meeting history live exclusively in your browser's `localStorage`. Nothing leaves your machine unless you explicitly export it.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + Vite |
| **AI Engine** | Google Gemini 2.5 Flash |
| **3D Effects** | Three.js + React Three Fiber |
| **Voice Input** | Web Speech API |
| **Automation** | Webhooks (n8n / Relay.app) |
| **Deployment** | Google Cloud App Engine |
| **Design System** | Custom "Aetheric Void" — glassmorphism, grain overlays, metallic atmosphere blobs |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey) (free tier works perfectly)

### Installation

```bash
# Clone the repository
git clone https://github.com/nika619/snap-app.git
cd snap-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Configuration
1. Open the app in your browser (default: `http://localhost:5173`)
2. Click the **⚙️ Settings** gear icon
3. Paste your **Gemini API Key**
4. *(Optional)* Paste a **Webhook URL** from n8n or Relay.app

> **Note:** API keys are stored securely in your browser's local storage. They are never sent to any server other than Google's Gemini API.

---

## 🔗 Webhook Integration (Sponsor Tool)

S.N.A.P. integrates directly with **n8n** and **Relay.app** via a native webhook engine.

### Setup
1. In n8n or Relay.app, create a new workflow with a **Webhook Trigger**
2. Copy the generated webhook URL
3. In S.N.A.P., go to **Settings → Automation Webhook URL** and paste it
4. Analyze a meeting, then click **"Send to Workflow"** on the results

### Payload Structure
```json
{
  "appName": "S.N.A.P.",
  "timestamp": "2026-03-29T01:00:00.000Z",
  "eventType": "new_meeting_analysis",
  "data": {
    "summary": "...",
    "actionItems": [
      {
        "task": "Finalize Q2 roadmap",
        "owner": "Sarah",
        "deadline": "Next Friday",
        "priority": "high"
      }
    ],
    "decisions": ["..."],
    "followUps": ["..."],
    "healthScore": {
      "score": 82,
      "clarity": 85,
      "actionability": 90,
      "participation": 70,
      "verdict": "Highly actionable meeting with clear outcomes."
    }
  }
}
```

---

## 🎨 Design Philosophy

S.N.A.P. uses a custom **"Aetheric Void"** design system featuring:
- **Glassmorphism cards** with frosted-glass backdrops
- **Metallic atmosphere blobs** for organic, living backgrounds
- **Grain texture overlays** for depth and premium feel
- **3D tilt effects** on interactive cards
- **Confetti burst** on successful analysis
- **Konami Code Easter Egg** — try `↑ ↑ ↓ ↓ ← → ← → B A` 🎮

---

## 📁 Project Structure

```
snap-app/
├── public/              # Static assets
├── src/
│   ├── components/
│   │   ├── effects/     # Confetti, Konami easter egg, cursor glow
│   │   ├── ui/          # TranscriptInput, ResultCards, SettingsModal
│   │   └── views/       # CompareView, ArchiveView
│   ├── services/
│   │   ├── gemini.js    # AI engine & prompt engineering
│   │   ├── exporters.js # Slack, Notion, JSON, Webhook formatters
│   │   ├── calendar.js  # Google Calendar URL generator
│   │   └── storage.js   # localStorage persistence layer
│   ├── App.jsx          # Root app with navigation & routing
│   ├── index.css        # Complete design system tokens
│   └── main.jsx         # Entry point
├── app.yaml             # Google Cloud App Engine config
├── index.html           # SEO-optimized shell
└── vite.config.js       # Build configuration
```

---

## 🌐 Deployment

The app is deployed on **Google Cloud App Engine** and accessible at:

🔗 **[https://snap-app-491619.uc.r.appspot.com](https://snap-app-491619.uc.r.appspot.com)**

To deploy your own instance:
```bash
npm run build
gcloud app deploy --project=YOUR_PROJECT_ID --quiet
```

---

## 📄 License

This project was built for the **LOV Hackathon 2026** under the **Productivity & Workflows** track.

---

<div align="center">

**Built with ❤️ and too much caffeine.**

*S.N.A.P. — Because your meetings deserve better than sticky notes.*

</div>


---

Built by [Mayank Tiwari](https://github.com/nika619) · [Hire me on Contra](https://contra.com/mayank_tiwari_a4vkcjsh)
