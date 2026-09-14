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