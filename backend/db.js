// backend/db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'kenya_mrv',
  password: 'nopassword', // Update to match your local postgres password
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') 
    ? { rejectUnauthorized: false } 
    : false
});

module.exports = pool;