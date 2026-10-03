CREATE TABLE oekb_reports (
    isin                  TEXT             NOT NULL,
    currency              TEXT             NOT NULL,
    date                  TEXT             NOT NULL,
    deemed_income         DOUBLE PRECISION NOT NULL,
    business_year_start   TEXT             NOT NULL,
    business_year_end     TEXT             NOT NULL,
    fetched_at            TEXT             NOT NULL,
    next_fetch_allowed_at TEXT             NOT NULL,
    PRIMARY KEY (isin, date)
);

CREATE TABLE etf_prices (
    isin         TEXT             NOT NULL,
    request_date TEXT             NOT NULL,
    result_date  TEXT             NOT NULL,
    price        DOUBLE PRECISION NOT NULL,
    currency     TEXT             NOT NULL,
    ticker       TEXT             NOT NULL,
    fetched_at   TEXT             NOT NULL,
    PRIMARY KEY (isin, request_date)
);

CREATE TABLE exchange_rates (
    currency                      TEXT             NOT NULL,
    request_date                  TEXT             NOT NULL,
    result_date                   TEXT             NOT NULL,
    exchange_rate_currency_to_eur DOUBLE PRECISION NOT NULL,
    fetched_at                    TEXT             NOT NULL,
    PRIMARY KEY (currency, request_date)
);

CREATE TABLE etf_info (
    isin       TEXT PRIMARY KEY,
    ticker     TEXT NOT NULL,
    name       TEXT NOT NULL,
    fetched_at TEXT NOT NULL
);
