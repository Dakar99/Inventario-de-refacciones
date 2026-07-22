const { Pool } = require('pg');
require('dotenv').config();

const usarSSL = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'refaccionaria',
    ssl: usarSSL ? { rejectUnauthorized: false } : false,
});

async function verificarConexion() {
    const client = await pool.connect();
    try {
        await client.query('SELECT NOW()');
        console.log('Conectado a PostgreSQL');
    } finally {
        client.release();
    }
}

module.exports = { pool, verificarConexion };
