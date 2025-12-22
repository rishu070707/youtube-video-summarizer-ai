
# AI Video Summarizer - Full Scaffold (Version B)

This repository is a ready-to-run scaffold for the **AI Video Summarizer** project (the Rishu-TV upgrade).
It includes a React frontend scaffold, Node.js backend, Python worker scripts for Whisper/scene-detection/summarization (stubs + runnable examples),
Docker Compose to run Redis + backend + worker locally, and instructions to extend to real ML workloads.

---
## What's included
- frontend: minimal React app (Vite) with VideoView page and components
- backend: Express server with /api/video endpoints, Firestore admin bootstrap, and queue integration (BullMQ)
- worker: Python worker that downloads YouTube video, extracts audio, runs scene detection (PySceneDetect stub),
  runs Whisper transcription (stub + optional WhisperX integration), summarizes using OpenAI (stub), and writes results to Firestore
- docker-compose.yml: to run redis, backend, and worker (worker uses python image)
- README contains quick start instructions and how to replace stubs with real ML code.

## Quick start (development)
1. Install Node.js (>=18) and Python (>=3.10)
2. Install docker and docker-compose (optional, recommended for Redis)
3. From this folder:
   - `cd frontend && npm install && npm run dev` (start frontend)
   - `cd backend && npm install && npm run dev` (start backend)
   - `python3 -m venv venv && source venv/bin/activate && pip install -r worker/requirements.txt`
   - Run worker: `python worker/worker.py`
4. Or use Docker Compose for Redis + backend + worker:
   - `docker compose up --build`

## Notes
- This scaffold uses Firebase Admin placeholders. Replace `backend/serviceAccountKey.json` with your Firebase admin SDK key.
- The worker contains clear TODOs where to plug in Whisper, PySceneDetect, and an LLM provider (OpenAI or local LLM).
- For embeddings, use Qdrant / Pinecone or a local FAISS index; the worker includes a simple FAISS stub.

---
Happy building!

