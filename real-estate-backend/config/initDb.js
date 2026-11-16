const pool = require("./db"); // သင့်ရဲ့ db connection ဖိုင် path အတိုင်း ချိန်ရန်

const initDB = async () => {
  try {
    console.log("🔄 Starting database initialization...");

    // 1. PostGIS Extension ဖန်တီးခြင်း (Location တွေအတွက် လိုအပ်ပါသည်)
    await pool.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    console.log("✔ PostGIS extension ready.");

    // 2. Users Table ဖန်တီးခြင်း (Coins, Subscription နှင့် Payment Proof များပါဝင်သည်)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        coins INTEGER DEFAULT 100,
        payment_proof TEXT,
        subscription_status VARCHAR(50) DEFAULT 'inactive',
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✔ 'users' table is ready.");

    // 3. Properties Table ဖန်တီးခြင်း (Views, Ratings, PostGIS Location များပါဝင်သည်)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        property_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        price NUMERIC(15,2) NOT NULL,
        area_sqft NUMERIC,
        address TEXT,
        township VARCHAR(100),
        city VARCHAR(100),
        location GEOMETRY(Point, 4326),
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        contact_phone VARCHAR(20),
        listing_type VARCHAR(50) DEFAULT 'Sale',
        ownership_document TEXT,
        building_status VARCHAR(100),
        average_rating NUMERIC(3,2) DEFAULT 0.00,
        total_ratings INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✔ 'properties' table is ready.");

    // 4. Property Images Table ဖန်တီးခြင်း
    await pool.query(`
      CREATE TABLE IF NOT EXISTS property_images (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        image_type VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✔ 'property_images' table is ready.");

    // 5. Property Documents Table ဖန်တီးခြင်း
    await pool.query(`
      CREATE TABLE IF NOT EXISTS property_documents (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        document_name VARCHAR(100),
        document_url TEXT NOT NULL,
        is_private BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✔ 'property_documents' table is ready.");

    // 6. Unlocked Contacts Table ဖန်တီးခြင်း (Coin ဖြင့် ဖုန်းနံပါတ်ဖွင့်ကြည့်ခြင်း မှတ်တမ်း)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS unlocked_contacts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        unlocked_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_property UNIQUE (user_id, property_id)
      );
    `);
    console.log("✔ 'unlocked_contacts' table is ready.");

    console.log("🎉 Database initialization completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error initializing database:", err);
    process.exit(1);
  }
};

initDB();
