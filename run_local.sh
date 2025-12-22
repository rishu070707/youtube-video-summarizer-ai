
#!/usr/bin/env bash
echo "Starting backend (node) in background..."
cd backend
npm install
npm run dev &
cd ..
echo "Start frontend:"
cd frontend
npm install
npm run dev
