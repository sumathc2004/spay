# SPay – Smart Digital Payment Platform

This project is a full-stack fintech demo built with React + Vite on the frontend and Express + MySQL on the backend.

## Project Structure

- frontend/ – React app
- backend/ – Express API and database config

## Frontend Run

```bash
cd frontend
npm install
npm run dev
```

## Backend Run

1. Start MySQL and ensure a database named `spay_db` is available.
2. Import the schema from `backend/database/schema.sql`.
3. Then run:

```bash
cd backend
npm install
npm run dev
```

## Demo Notes

- This is a sandbox fintech demo.
- No real banking or card processing is connected.
- JWT auth and wallet APIs are included to match the requested project structure.
