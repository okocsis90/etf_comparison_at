# ETF Comparison AT

ETF tax analysis application for Austrian investors. The frontend, API, PostgreSQL database, and schema migrations run as Docker Compose services.

## Run the containerized application

1. Copy `.env.example` to `.env` and set a strong `POSTGRES_PASSWORD`.
2. Start the services:

   ```sh
   docker compose up --build -d
   ```
3. Open `http://localhost:8080` (or the configured `APP_PORT`).

Flyway applies SQL migrations before the API starts. PostgreSQL data persists in the `postgres_data` Docker volume. Back up this volume or the database before removing it.

PostgreSQL is published on loopback by default. To let applications on other hosts connect, set `POSTGRES_BIND_ADDRESS` to an externally reachable interface and restrict access with a firewall; configure those clients with the same database credentials and schema.

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
