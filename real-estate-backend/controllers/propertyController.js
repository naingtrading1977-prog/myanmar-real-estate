const { pool } = require("../config/db");
const Groq = require("groq-sdk");
const fs = require("fs");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function validatePropertyImage(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString("base64");

    const chatCompletion = await groq.chat.completions.create {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Is this image related to real estate, such as a house, apartment, condo, building interior/exterior, land plot, or floor plan? Answer strictly with 'YES' or 'NO' only.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 10,
    };

    const resultText =
      chatCompletion.choices[0]?.message?.content?.trim().toUpperCase() || "";
    return resultText.includes("YES");
  } catch (err) {
    console.error("Groq AI Validation Error:", err);
    return true; 
  }
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
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.mimetype.startsWith("image/")) {
          const isValidPropertyImage = await validatePropertyImage(file.path);

          if (!isValidPropertyImage) {
            for (const f of req.files) {
              if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
            }
            return res.status(400).json({
              error:
                "တင်လိုက်သော ပုံများထဲတွင် အိမ်ခြံမြေနှင့် မသက်ဆိုင်သည့် ပုံများ ပါဝင်နေပါသည်။ ကျေးဇူးပြု၍ မှန်ကန်သော ပုံများကိုသာ တင်ပေးပါ။",
            });
          }
        }
      }
    }

    // Number ပုံစံသို့ ပြောင်းလဲခြင်း (Location မှန်ကန်စေရန်)
    const parsedLng = longitude ? parseFloat(longitude) : null;
    const parsedLat = latitude ? parseFloat(latitude) : null;

    const query = `
      INSERT INTO properties (
        title, description, property_type, listing_type, status, price, area_sqft,
        address, township, city, location, owner_id, contact_phone, ownership_document, building_status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        CASE WHEN $11 IS NOT NULL AND $12 IS NOT NULL 
             THEN ST_SetSRID(ST_MakePoint($11, $12), 4326) 
             ELSE NULL END,
        $13, $14, $15, $16
      )
      RETURNING *;
    `;

    const values = [
      title,
      description,
      property_type,
      listing_type || "Sale",
      status || (listing_type === "Rent" ? "For Rent" : "For Sale"),
      price,
      area_sqft,
      address,
      township,
      city,
      parsedLng, // $11 (Longitude)
      parsedLat, // $12 (Latitude)
      owner_id,
      contact_phone,
      ownership_document,
      building_status,
    ];

    const result = await pool.query(query, values);
    const newProperty = result.rows[0];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = `/uploads/${file.filename}`;
        await pool.query(
          `INSERT INTO property_images (property_id, image_url, image_type) VALUES ($1, $2, $3)`,
          [newProperty.id, imageUrl, "site_photo"],
        );
      }
    }

    const imagesQuery = `SELECT id, image_url AS url, image_type FROM property_images WHERE property_id = $1;`;
    const imagesResult = await pool.query(imagesQuery, [newProperty.id]);
    newProperty.images = imagesResult.rows;

    res.status(201).json({
      success: `Property created successfully!`,
      data: newProperty,
    });
  } catch (err) {
    console.error("Create Property Error:", err.message);
    res.status(500).json({ error: "Server Error during property creation" });
  }
};

exports.getProperties = async (req, res) => {
  try {
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
      .status(200)
      .json({ success: true, count: 0, data: [], db_error: err.message });
  }
};

exports.getNearbyProperties = async (req, res) => {
  const { lat, lng, radius_in_km = 5 } = req.query;

  try {
    const query = `
      SELECT p.*,
        ST_X(p.location::geometry) AS longitude,
        ST_Y(p.location::geometry) AS latitude,
        ST_Distance(p.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
        COALESCE(
          json_agg(
            json_build_object('id', img.id, 'url', img.image_url, 'type', img.image_type)
          ) FILTER (WHERE img.id IS NOT NULL), '[]'
        ) AS images
      FROM properties p
      LEFT JOIN property_images img ON p.id = img.property_id
      WHERE ST_DWithin(
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
    console.error(err.message);
    res.status(500).json({ error: "Server Error on Geo-search" });
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
      const fileUrl = `/uploads/${file.filename}`;

      if (file.mimetype === "application/pdf") {
        await pool.query(
          `INSERT INTO property_documents (property_id, document_name, document_url, is_private)
           VALUES ($1, $2, $3, $4)`,
          [property_id, file.originalname, fileUrl, true],
        );
      } else {
        await pool.query(
          `INSERT INTO property_images (property_id, image_url, image_type)
           VALUES ($1, $2, $3)`,
          [property_id, fileUrl, "site_photo"],
        );
      }

      uploadedResults.push({
        filename: file.originalname,
        url: fileUrl,
      });
    }

    res.status(200).json({
      success: true,
      message: "Files uploaded & saved to Database successfully!",
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
        building_status = COALESCE($13, building_status),
        updated_at = NOW()
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

    if (latitude && longitude) {
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

    if (req.files && req.files.length > 0) {
      await pool.query(`DELETE FROM property_images WHERE property_id = $1`, [
        propertyId,
      ]);

      for (const file of req.files) {
        const imageUrl = `/uploads/${file.filename}`;
        await pool.query(
          `INSERT INTO property_images (property_id, image_url, image_type) VALUES ($1, $2, $3)`,
          [propertyId, imageUrl, "site_photo"],
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
    res.status(500).json({ error: "Server Error during property update" });
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

    const updateQuery = await pool.query(
      "UPDATE properties SET average_rating = $1, total_ratings = $2 WHERE id = $3 RETURNING *",
      [newAvg.toFixed(2), newTotal, id],
    );

    res.json({
      message: "Rating submitted successfully",
      property: updateQuery.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
