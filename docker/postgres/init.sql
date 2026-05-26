CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS panen (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    komoditas VARCHAR(255) NOT NULL,
    jumlah INTEGER NOT NULL,
    satuan VARCHAR(50) NOT NULL,
    tanggal_panen DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
