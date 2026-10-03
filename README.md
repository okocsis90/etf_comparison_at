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

## Optional SQLite cache data

The application works with an empty cache by default; no data file is needed in Git or in a deployment package. If you have an existing SQLite cache to seed the PostgreSQL database, place it at `server/data/etf-cache.db` on the machine where Compose runs. The `server/data/` directory is Git-ignored and mounted read-only into the API container.

On API startup, the SQLite cache is imported only if that file exists and the PostgreSQL cache is empty. If the file is absent, startup continues with an empty PostgreSQL cache and the application fetches data as needed. If PostgreSQL already has cached rows, the optional import is skipped without opening the SQLite file. Imported data lives in the persistent PostgreSQL volume, so the source file is not needed after a successful import. The import is transactional and does not overwrite existing rows.

## Local development

The Vite frontend runs with `npm run dev` from the repository root and proxies `/api` to `http://localhost:3001`. Run PostgreSQL and Flyway as above, then start the backend from `server` with `npm start`. Configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`, or provide `DATABASE_URL`.
