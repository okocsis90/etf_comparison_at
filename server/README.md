# ETF Comparison Backend

Node.js API for ETF reports, prices, and Austrian tax-efficiency scores. Persistent cached data is stored in PostgreSQL; Flyway owns all schema migrations in `db/migration`.

Use Docker Compose from the repository root for the complete application. The backend requires PostgreSQL and an already migrated schema. For local development, configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` (or `DATABASE_URL`), then run:

```sh
npm install
npm start
```

The score endpoint is `/api/score?isin=IE00BK5BQX27`; `/health` checks database connectivity.

To migrate the existing ignored SQLite cache, start PostgreSQL and run Flyway first, then set `DATABASE_URL` and execute `npm run import:sqlite`. The importer defaults to `data/etf-cache.db` and accepts an alternate SQLite path as its first argument.
