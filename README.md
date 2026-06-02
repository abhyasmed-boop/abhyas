# Abhyas — Clinical Simulation Platform

A GenAI-powered clinical simulation platform for medical education.

## Status
Testing phase — framework validation with real students.

## Tech Stack
- Frontend: React (Netlify)
- Backend: Netlify Functions (Node.js)
- Database: Supabase (PostgreSQL + Auth)
- AI: Groq (testing) → Claude (production)

## Environment Variables
Set these in Netlify → Site settings → Environment variables:

```
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Local Development
```
npm install
npm start
```
