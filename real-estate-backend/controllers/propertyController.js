const { pool } = require("../config/db");
const multer = require("multer");
const supabase = require("../config/supabaseClient"); // Supabase client ကို ချိတ်ဆက်ရန်

// Memory Storage ကို သုံးခြင်း (ဖိုင်များကို Server ပေါ်တွင် Local သိမ်းဆည်းခြင်းမရှိဘဲ Memory ထဲတွင် ကိုင်တွယ်ရန်)
const upload = multer({ storage: multer.memoryStorage() });

// ပုံများကို Supabase Storage သို့ တင်ပြီး Public URL ရယူသည့် Helper Function
async function uploadToSupabaseStorage(file) {
  const fileExt = file.originalname.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `properties/${fileName}`;

  // Supabase Storage Bucket ('property-images') သို့ တင်ခြင်း
  const { data, error } = await supabase.storage
    .from("property-images")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error("Supabase Storage Upload Error: " + error.message);
  }

  // Public URL ကို ရယူခြင်း
  const { data: publicURLData } = supabase.storage
    .from("property-images")
    .getPublicUrl(filePath);

  return publicURLData.publicUrl;
}

exports.createProperty = async (req, res) => {
  const {
    title,
    description,
    property_type,
    listing_type,
    status,
    price,
    area_sqft,
    address,
    township,
    city,
    latitude,
    longitude,
    contact_phone,
    ownership_document,
    building_status,
  } = req.body;

  const owner_id = req.user ? req.user.id : null;

  try {
    const parsedLng = longitude ? parseFloat(longitude) : null;
    const parsedLat = latitude ? parseFloat(latitude) : null;

    // 1. Database ထဲသို့ Property အချက်အလက်များ ထည့်သွင်းခြင်း (Query & Placeholders ပြင်ဆင်ခြင်း)
    let query = `
      INSERT INTO properties (
        title, description, property_type, listing_type, status, price, area_sqft,
        address, township, city, location, owner_id, contact_phone, ownership_document, building_status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
    `;

    const values = [
      title || null,
      description || null,
      property_type || null,
      listing_type || "Sale",
      status || (listing_type === "Rent" ? "For Rent" : "For Sale"),
      price || 0,
      area_sqft || null,
      address || null,
      township || null,
      city || "Yangon",
    ];

    // Latitude နဲ့ Longitude ပါဝင်မှုအပေါ်မူတည်၍ placeholder များကို တိကျစွာ စီစဉ်ခြင်း
    if (parsedLng !== null && parsedLat !== null) {
      query += ` ST_SetSRID(ST_MakePoint($11, $12), 4326), $13, $14, $15, $16)`;
      values.push(
        parsedLng,
        parsedLat,
        owner_id,
        contact_phone || null,
        ownership_document || null,
        building_status || null,
      );
    } else {
      query += ` NULL, $11, $12, $13, $14)`;
      values.push(
        owner_id,
        contact_phone || null,
        ownership_document || null,
        building_status || null,
      );
    }

    query += ` RETURNING *;`;

    const result = await pool.query(query, values);
    const newProperty = result.rows[0];

    // 2. Supabase Storage သို့ ပုံများတင်ပြီး Public URL များကို property_images table ထဲ သိမ်းခြင်း
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const publicUrl = await uploadToSupabaseStorage(file);
        await pool.query(
          `INSERT INTO property_images (property_id, image_url, image_type) VALUES ($1, $2, $3)`,
          [newProperty.id, publicUrl, "site_photo"],
        );
      }
    }

    const imagesQuery = `SELECT id, image_url AS url, image_type FROM property_images WHERE property_id = $1;`;
    const imagesResult = await pool.query(imagesQuery, [newProperty.id]);
    newProperty.images = imagesResult.rows;

    res.status(201).json({
      success: true,
      message: `Property created successfully!`,
      data: newProperty,
    });
  } catch (err) {
    console.error("Create Property Error:", err.message);
    res
      .status(500)
      .json({ error: "Server Error during property creation: " + err.message });
  }
};

exports.getProperties = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*, 
        CASE 
          WHEN p.location IS NOT NULL THEN ST_X(p.location::geometry) 
          ELSE NULL 
        END AS longitude,
        CASE 
          WHEN p.location IS NOT NULL THEN ST_Y(p.location::geometry) 
          ELSE NULL 
        END AS latitude,
        COALESCE(
          json_agg(
            json_build_object('id', img.id, 'url', img.image_url, 'type', img.image_type)
          ) FILTER (WHERE img.id IS NOT NULL), '[]'
        ) AS images
      FROM properties p
      LEFT JOIN property_images img ON p.id = img.property_id
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `;

    const { rows } = await pool.query(query);
    return res
      .status(200)
      .json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error("DB Error:", err.message);
    return res
      .status(500)
      .json({ success: false, error: "Server Error: " + err.message });
  }
};

exports.getNearbyProperties = async (req, res) => {
  const { lat, lng, radius_in_km = 5 } = req.query;

  try {
    const query = `
      SELECT p.*,
        CASE 
          WHEN p.location IS NOT NULL THEN ST_X(p.location::geometry) 
          ELSE NULL 
        END AS longitude,
        CASE 
          WHEN p.location IS NOT NULL THEN ST_Y(p.location::geometry) 
          ELSE NULL 
        END AS latitude,
        ST_Distance(p.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
        COALESCE(
          json_agg(
            json_build_object('id', img.id, 'url', img.image_url, 'type', img.image_type)
          ) FILTER (WHERE img.id IS NOT NULL), '[]'
        ) AS images
      FROM properties p
      LEFT JOIN property_images img ON p.id = img.property_id
      WHERE p.location IS NOT NULL AND ST_DWithin(
        p.location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3 * 1000
      )
      GROUP BY p.id
      ORDER BY distance_meters ASC;
    `;

    const { rows } = await pool.query(query, [lng, lat, radius_in_km]);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error("Geo-search Error:", err.message);
    res
      .status(500)
      .json({ error: "Server Error on Geo-search: " + err.message });
  }
};

exports.uploadPropertyFiles = async (req, res) => {
  const { property_id } = req.params;
  const files = req.files;

  try {
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Please select files to upload." });
    }

    const uploadedResults = [];

    for (const file of files) {
      const publicUrl = await uploadToSupabaseStorage(file);

      if (file.mimetype === "application/pdf") {
        await pool.query(
          `INSERT INTO property_documents (property_id, document_name, document_url, is_private)
           VALUES ($1, $2, $3, $4)`,
          [property_id, file.originalname, publicUrl, true],
        );
      } else {
        await pool.query(
          `INSERT INTO property_images (property_id, image_url, image_type)
           VALUES ($1, $2, $3)`,
          [property_id, publicUrl, "site_photo"],
        );
      }

      uploadedResults.push({
        filename: file.originalname,
        url: publicUrl,
      });
    }

    res.status(200).json({
      success: true,
      message: "Files uploaded & saved to Supabase Storage successfully!",
      data: uploadedResults,
    });
  } catch (err) {
    console.error("Upload Controller Error:", err.message);
    res
      .status(500)
      .json({ error: err.message || "Server Error during file upload" });
  }
};

exports.updateProperty = async (req, res) => {
  const propertyId = req.params.id;
  const {
    title,
    description,
    property_type,
    listing_type,
    status,
    price,
    area_sqft,
    address,
    township,
    city,
    latitude,
    longitude,
    contact_phone,
    ownership_document,
    building_status,
  } = req.body || {};

  try {
    let query = `
      UPDATE properties 
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        property_type = COALESCE($3, property_type),
        listing_type = COALESCE($4, listing_type),
        status = COALESCE($5, status),
        price = COALESCE($6, price),
        area_sqft = COALESCE($7, area_sqft),
        address = COALESCE($8, address),
        township = COALESCE($9, township),
        city = COALESCE($10, city),
        contact_phone = COALESCE($11, contact_phone),
        ownership_document = COALESCE($12, ownership_document),
        building_status = COALESCE($13, building_status)
    `;

    const values = [
      title,
      description,
      property_type,
      listing_type,
      status,
      price,
      area_sqft,
      address,
      township,
      city,
      contact_phone,
      ownership_document,
      building_status,
    ];

    let paramIndex = 14;

    if (
      latitude !== undefined &&
      latitude !== "" &&
      longitude !== undefined &&
      longitude !== ""
    ) {
      query += `, location = ST_SetSRID(ST_MakePoint($${paramIndex}, $${paramIndex + 1}), 4326)`;
      values.push(parseFloat(longitude), parseFloat(latitude));
      paramIndex += 2;
    }

    query += ` WHERE id = $${paramIndex} RETURNING *;`;
    values.push(propertyId);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    const updatedProperty = result.rows[0];

    // ပုံသစ်များ ပါလာမှသာ ပုံဟောင်းများကို ဖျက်ပြီး Supabase သို့ အသစ်တင်မည်
    if (req.files && req.files.length > 0) {
      await pool.query(`DELETE FROM property_images WHERE property_id = $1`, [
        propertyId,
      ]);

      for (const file of req.files) {
        const publicUrl = await uploadToSupabaseStorage(file);
        await pool.query(
          `INSERT INTO property_images (property_id, image_url, image_type) VALUES ($1, $2, $3)`,
          [propertyId, publicUrl, "site_photo"],
        );
      }
    }

    const imagesQuery = `SELECT id, image_url AS url, image_type FROM property_images WHERE property_id = $1;`;
    const imagesResult = await pool.query(imagesQuery, [propertyId]);
    updatedProperty.images = imagesResult.rows;

    res.status(200).json({
      success: true,
      message: "Property updated successfully!",
      data: updatedProperty,
    });
  } catch (err) {
    console.error("Update Property Error:", err.message);
    res
      .status(500)
      .json({ error: "Server Error during property update: " + err.message });
  }
};

exports.deleteProperty = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`DELETE FROM property_images WHERE property_id = $1`, [
      id,
    ]);
    await pool.query(`DELETE FROM property_documents WHERE property_id = $1`, [
      id,
    ]);

    const result = await pool.query(
      `DELETE FROM properties WHERE id = $1 RETURNING id;`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.status(200).json({
      success: true,
      message: "Property deleted successfully!",
    });
  } catch (err) {
    console.error("Delete Error:", err.message);
    res.status(500).json({ error: "Server Error during property deletion" });
  }
};

exports.getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`UPDATE properties SET views = views + 1 WHERE id = $1`, [
      id,
    ]);

    const query = `
      SELECT 
        p.*, 
        ST_X(p.location::geometry) AS longitude,
        ST_Y(p.location::geometry) AS latitude,
        COALESCE(
          json_agg(
            json_build_object('id', img.id, 'url', img.image_url, 'type', img.image_type)
          ) FILTER (WHERE img.id IS NOT NULL), '[]'
        ) AS images
      FROM properties p
      LEFT JOIN property_images img ON p.id = img.property_id
      WHERE p.id = $1
      GROUP BY p.id;
    `;

    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Property not found" });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("DB Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.rateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    const parsedRating = parseFloat(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const propQuery = await pool.query(
      "SELECT average_rating, total_ratings FROM properties WHERE id = $1",
      [id],
    );
    if (propQuery.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    const currentAvg = parseFloat(propQuery.rows[0].average_rating) || 0;
    const currentTotal = parseInt(propQuery.rows[0].total_ratings) || 0;

    const newTotal = currentTotal + 1;
    const newAvg = (currentAvg * currentTotal + parsedRating) / newTotal;

    const query = `
      UPDATE properties 
      SET average_rating = $1, total_ratings = $2 
      WHERE id = $3 
      RETURNING *;
    `;
    const updateQuery = await pool.query(query, [
      newAvg.toFixed(2),
      newTotal,
      id,
    ]);

    res.json({
      message: "Rating submitted successfully",
      property: updateQuery.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
