CREATE SCHEMA IF NOT EXISTS util;

CREATE TABLE IF NOT EXISTS util.sessions (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS util.notifications (
    id             BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id        BIGINT NOT NULL,
    title          TEXT NOT NULL,
    message        TEXT,
    type           TEXT NOT NULL,
    reference_type TEXT,
    reference_id   BIGINT,
    is_read        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
