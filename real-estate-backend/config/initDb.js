const { pool } = require("./db");

const createTables = async () => {
  const queryText = `
    -- Enable PostGIS Extension for Geospatial queries
    CREATE EXTENSION IF NOT EXISTS postgis;

    -- 1. Users Table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(20) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'user', -- 'admin', 'agent', 'user'
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Properties Table
    CREATE TABLE IF NOT EXISTS properties (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      property_type VARCHAR(50) NOT NULL, -- 'land', 'condo', 'house', 'apartment'
      status VARCHAR(50) NOT NULL,        -- 'for_sale', 'for_rent', 'sold'
      price DECIMAL(15, 2) NOT NULL,
      area_sqft NUMERIC,
      address TEXT,
      township VARCHAR(100),
      city VARCHAR(100),
      
      -- PostGIS Geometry Point (SRID 4326 for WGS84 - GPS Standard)
      location GEOMETRY(Point, 4326),
      
      owner_id INT REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Property Images Table
    CREATE TABLE IF NOT EXISTS property_images (
      id SERIAL PRIMARY KEY,
      property_id INT REFERENCES properties(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      image_type VARCHAR(50) DEFAULT 'general', -- 'site_photo', 'layout_map', 'interior'
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Property Documents Table (ဂရန်/ပိုင်ဆိုင်မှု စာရွက်စာတမ်းများ)
    CREATE TABLE IF NOT EXISTS property_documents (
      id SERIAL PRIMARY KEY,
      property_id INT REFERENCES properties(id) ON DELETE CASCADE,
      document_name VARCHAR(100),
      document_url TEXT NOT NULL,
      is_private BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(queryText);
    console.log("All DB Tables created successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error creating DB tables:", err.message);
    process.exit(1);
  }
};

createTables();
