# Development Setup & Troubleshooting

This document contains common troubleshooting steps for running the Placement Dashboard locally.

## URL accessibility check endpoint

A new endpoint is available to validate resume/profile links:

- POST /api/utils/check-url
  - Body: { url: string }
  - Returns: { ok: boolean, status: number|null, contentType?: string, reason?: string }

Examples:

```
curl -X POST http://localhost:5001/api/utils/check-url -H 'Content-Type: application/json' -d '{"url":"https://example.com/file.pdf"}'
```

If a link is not accessible (network failure, 4xx/5xx or contains access/login page), the endpoint returns ok=false and a `reason`, and the frontend blocks saving a profile with an inaccessible resume link.
## Common issues

### Port already in use (EADDRINUSE)
If you see an error like:

  Error: listen EADDRINUSE: address already in use :::5001

Do the following:

- Find the process using the port:

```
lsof -ti TCP:5001 -sTCP:LISTEN
```

- Kill that process (replace <PID> with the returned PID):

```
kill <PID>
# or force kill
lsof -ti TCP:5001 -sTCP:LISTEN | xargs kill -9
```

- Alternatively, start the server on a different port:

```
PORT=5002 npm run dev
```

### Server unreachable from frontend (Connection Refused)
Ensure the backend is running and reachable at `http://localhost:5001` (or the configured PORT). Use the health endpoint:

```
curl http://localhost:5001/api/health
```

The response should include `status: ok` and `database: { status: connected }`.

### Migrations and data fixes
- Run skill ID backfill (dry-run first):

```
cd backend
npm run migrate:skill-ids:dry
```

- Apply migration if dry-run looks good:

```
npm run migrate:skill-ids
```

- Scan for skill name mismatches:

```
node scripts/find_skill_mismatches.js
# Output is written to backend/scripts/skill_mismatch_report.json
```

### Restarting dev servers
Use the `concurrently` scripts in the repo root, or run servers separately:

```
# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm run dev
```

## Quick checklist
- Backend: running (check `npm run dev` logs)
- Frontend: running (Vite dev server)
- Database: MongoDB reachable (check `MONGODB_URI` env var)
- If you change ports or DB URIs, update `.env` or pass env vars inline

---
If you want, I can add more troubleshooting steps specific to your environment (Docker, remote MongoDB, etc.).