# Local Development Guide

## Prerequisites
- Docker Desktop or another container runtime
- Node.js 18+
- npm 9+

## 1. Install dependencies
Run the workspace bootstrap once to ensure every package is ready:

```bash
npm install --workspaces
```

## 2. Environment configuration
Copy each `.env.example` to `.env.local` (already provided with sensible defaults) and confirm the following values:

```bash
backend/.env.local
  POSTGRES_* = venicars
  DB_SYNCHRONIZE=true   # auto-creates tables for local dev
  JWT_SECRET=change-me
frontend/.env.local
  VITE_API_URL=http://localhost:4000/api
  VITE_SOCKET_URL=http://localhost:4000
jt808-service/.env.local
  TCP_PORT=6808
  API_BASE_URL=http://localhost:4000/api
  API_TOKEN=<will be filled after login>
```

## 3. Start infrastructure
Launch PostgreSQL and Redis in the background:

```bash
docker-compose up -d
```

Data volumes are persisted under `docker/postgres-data` and `docker/redis-data`.

## 4. Seed mock data
Once PostgreSQL is up, load the demo operators, vehicles, telemetry, and reports:

```bash
npm run seed:backend
```

The seed creates three drivers, three vehicles, recent JT/T 808 position samples, one alarm, and daily/monthly analytics. It is idempotent and can be re-run safely.

## 5. Start services
Open three terminals and run:

```bash
npm run dev:backend
npm run dev:frontend
npm run dev:gateway
```

The backend listens on `http://localhost:4000`, Vite serves the UI on `http://localhost:3000`, and the gateway opens TCP port `6808` for JT/T 808 devices.

## 6. Obtain an API token for the gateway
The seed ensures an admin user exists. Fetch a token via:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Copy the `token` response value into `jt808-service/.env.local` as `API_TOKEN` and restart the gateway if it is already running.

## 7. (Optional) Simulate device traffic
With the gateway running, replay the canned sample frame:

```bash
npm run mock --workspace jt808-service
```

This uses `jt808-service/testdata/sample_position.hex` to push telemetry through the TCP listener, which is then forwarded to the backend API.

## 8. Clean up
To stop infrastructure containers:

```bash
docker-compose down
```

Remove volumes as needed: `docker-compose down -v`.
