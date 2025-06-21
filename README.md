# Vocal Coach AI - Hackathon Project

Vocal Coach AI is a full-stack web application built for a hackathon. It serves as a personal singing coach that provides users with real-time pitch analysis, deep vocal analytics, and an intelligent, dual-AI coaching system.

The core of the project is a two-pronged AI approach:
1.  **A Proactive Fetch.ai Agent**: Autonomously analyzes daily vocal practice sessions to identify trends and generate progress reports.
2.  **A Reactive Letta Conversational Agent**: Engages in a stateful dialogue with the user, using the data from the Fetch.ai reports to provide personalized, context-aware coaching.

## 🚀 Core Features

-   **Real-Time Pitch Detection**: Instant feedback during practice sessions.
-   **Deep Vocal Analysis**: Backend processing provides metrics on jitter, shimmer, vibrato, and more.
-   **AI-Generated Reports**: Daily summaries of performance trends and insights.
-   **Stateful AI Coach**: A chatbot that remembers context and discusses your specific progress.

## 🛠 Tech Stack

-   **Frontend**: React, TypeScript, Vite, Tailwind CSS
-   **Backend**: FastAPI (Python)
-   **AI Services**: Letta & Fetch.ai
-   **Database & Auth**: Supabase
-   **Hosting**: Netlify (Frontend) & Google Cloud Run (Backend)
