ALTER TABLE oekb_reports
    ALTER COLUMN date TYPE DATE USING CASE
        WHEN date ~ '^\d{4}-\d{2}-\d{2}$' THEN date::DATE
        ELSE TO_DATE(date, 'DD.MM.YYYY')
    END,
    ALTER COLUMN business_year_start TYPE DATE USING CASE
        WHEN business_year_start ~ '^\d{4}-\d{2}-\d{2}$' THEN business_year_start::DATE
        ELSE TO_DATE(business_year_start, 'DD.MM.YYYY')
    END,
    ALTER COLUMN business_year_end TYPE DATE USING CASE
        WHEN business_year_end ~ '^\d{4}-\d{2}-\d{2}$' THEN business_year_end::DATE
        ELSE TO_DATE(business_year_end, 'DD.MM.YYYY')
    END,
    ALTER COLUMN fetched_at TYPE TIMESTAMPTZ USING fetched_at::TIMESTAMPTZ,
    ALTER COLUMN next_fetch_allowed_at TYPE TIMESTAMPTZ USING next_fetch_allowed_at::TIMESTAMPTZ;

ALTER TABLE etf_prices
    ALTER COLUMN request_date TYPE DATE USING request_date::DATE,
    ALTER COLUMN result_date TYPE DATE USING result_date::DATE,
    ALTER COLUMN fetched_at TYPE TIMESTAMPTZ USING fetched_at::TIMESTAMPTZ;

ALTER TABLE exchange_rates
    ALTER COLUMN request_date TYPE DATE USING request_date::DATE,
    ALTER COLUMN result_date TYPE DATE USING result_date::DATE,
    ALTER COLUMN fetched_at TYPE TIMESTAMPTZ USING fetched_at::TIMESTAMPTZ;

ALTER TABLE etf_info
    ALTER COLUMN fetched_at TYPE TIMESTAMPTZ USING fetched_at::TIMESTAMPTZ;
