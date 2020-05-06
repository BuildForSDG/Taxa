const { Pool } = require('pg');
const {
  dbDatabase,
  dbHost,
  dbUser,
  dbPassword,
  dbPort
} = require('../../config');

const pool = new Pool({
  user: dbUser,
  host: dbHost,
  database: dbDatabase,
  password: dbPassword,
  port: dbPort
});

module.exports = {
  query: (text, params, callback) => pool.query(text, params, callback)
};
