const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// PostGIS Extension ရှိမရှိ စစ်ဆေးခြင်း နှင့် Connection တည်ဆောက်ခြင်း
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("PostgreSQL Connected Successfully.");

    // Auto-enable PostGIS Extension for Map functionality
    await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");
    console.log("PostGIS Extension Enabled.");

    client.release();
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
