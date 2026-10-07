CREATE TABLE daily_user_counts (
    usage_date   DATE PRIMARY KEY,
    unique_users INTEGER NOT NULL CHECK (unique_users >= 0)
);

CREATE TABLE daily_usage_visitors (
    usage_date DATE NOT NULL,
    visitor_id UUID NOT NULL,
    PRIMARY KEY (usage_date, visitor_id)
);
