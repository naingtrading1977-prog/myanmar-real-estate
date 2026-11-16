const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("PostgreSQL Connected Successfully.");
    await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");
    console.log("PostGIS Extension Enabled.");
    client.release();
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
