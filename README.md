# ETF Comparison AT

ETF tax analysis application for Austrian investors. The frontend, API, PostgreSQL database, and schema migrations run as Docker Compose services.

## Run locally with Docker Compose

Docker Desktop (including Docker Compose) is the only prerequisite; PostgreSQL does not need to be installed separately.

1. In the project root, create your local environment file and open it:

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

2. Replace `POSTGRES_PASSWORD` with a password of your choice, save `.env`, then build and start the application:

   ```powershell
   docker compose up --build -d
   ```

   The password is required; Compose will stop with an error if it is missing. `.env` is excluded from Git. Keep it private and do not include it when sharing the project.

3. Open `http://localhost:8080` (or the port configured by `APP_PORT`).

Compose builds the frontend and API images on the local machine. It starts PostgreSQL, waits for it to become healthy, applies the SQL migrations with Flyway, and then starts the API and frontend. PostgreSQL is available only on this machine by default.

Useful commands:

```powershell
docker compose ps                 # Show service status
docker compose logs -f            # Follow logs
docker compose down               # Stop and remove containers; keep database data
docker compose up -d              # Start again after stopping
```

Database files live in the named Docker volume `postgres_data`, not in the containers. They persist across Docker/container restarts and computer shutdowns. `docker compose down -v` removes that volume and permanently deletes the database contents. Back up important data separately; a Docker volume is not a backup.

To share a locally runnable package, provide the project files, including `compose.yaml`, both Dockerfiles, `nginx.conf`, and `server/db/migration/`. The recipient needs Docker Desktop and creates their own `.env` from `.env.example`, then runs the same `docker compose up --build -d` command. Do not share your `.env`. This local setup builds the images on each recipient's machine; publishing prebuilt images can be added later.

## Import the existing SQLite cache

The repository's SQLite cache is ignored by git and must be present at `server/data/etf-cache.db` on the machine running the import. Start PostgreSQL and apply migrations first:

```sh
docker compose up -d postgres
docker compose run --rm migrate
```

Then run the one-time importer from the repository root, using the PostgreSQL credentials from `.env`:

```powershell
$env:DB_HOST = 'localhost'
$env:DB_PORT = '5432'
$env:DB_NAME = 'etf_comparison'
$env:DB_USER = 'etf_app'
$env:DB_PASSWORD = 'your-password'
npm.cmd --prefix server run import:sqlite
```

The import is transactional and repeatable: existing PostgreSQL rows are left unchanged. It imports reports, historical prices, exchange rates, and ETF metadata. Afterward, start the complete application with `docker compose up --build -d`.

## Local development

The Vite frontend runs with `npm run dev` from the repository root and proxies `/api` to `http://localhost:3001`. Run PostgreSQL and Flyway as above, then start the backend from `server` with `npm start`. Configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`, or provide `DATABASE_URL`.
