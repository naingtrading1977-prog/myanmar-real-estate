const { pool } = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// uploads folder ရှိမရှိ စစ်ဆေးပြီး မရှိရင် အလိုအလျောက် ဆောက်ပေးခြင်း
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Disk Storage ကို အသုံးပြု၍ Server ပေါ်တွင် ဖိုင်များကို Local သိမ်းဆည်းခြင်း
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${file.originalname.split(".").pop()}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

// 🔑 ១။ ပို့စ်အသစ်တင်ရန် (30 Coins ဖြတ်မည့် Logic ပါဝင်သည်)
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
  const UPLOAD_POINTS_REQUIRED = 30; // ပို့စ်တင်ခ ၃၀ မှတ်

  const cleanAreaSqft =
    area_sqft !== undefined &&
    area_sqft !== null &&
    String(area_sqft).trim() !== "" &&
    !Number.isNaN(parseFloat(area_sqft))
      ? parseFloat(area_sqft)
      : null;

  if (!owner_id) {
    return res.status(401).json({ success: false, error: "Unauthorized user" });
  }

  try {
    // ပွဲစားမှာ Point လောက်ရဲ့လား စစ်ဆေးခြင်း
    const userQuery = await pool.query(
      "SELECT coins FROM users WHERE id = $1",
      [owner_id],
    );
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const currentCoins = userQuery.rows[0].coins;
    if (currentCoins < UPLOAD_POINTS_REQUIRED) {
      return res.status(400).json({
        success: false,
        error:
          "Point မလောက်တော့ပါဘူးအကို။ ပို့စ်တင်ရန် ကျေးဇူးပြု၍ ငွေပြန်ဖြည့်ပါ။",
      });
    }

    const parsedLng =
      longitude !== undefined &&
      longitude !== null &&
      String(longitude).trim() !== "" &&
      !Number.isNaN(parseFloat(longitude))
        ? parseFloat(longitude)
        : null;

    const parsedLat =
      latitude !== undefined &&
      latitude !== null &&
      String(latitude).trim() !== "" &&
      !Number.isNaN(parseFloat(latitude))
        ? parseFloat(latitude)
        : null;

    // Database Transaction စတင်မည်
    await pool.query("BEGIN");

    // ပွဲစား၏ Point ကို ၃၀ လျော့မည်
    await pool.query("UPDATE users SET coins = coins - $1 WHERE id = $2", [
      UPLOAD_POINTS_REQUIRED,
      owner_id,
    ]);

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
      cleanAreaSqft, // 👈 ဒီနေရာမှာ cleanAreaSqft ပြောင်းထည့်ပေးပါ
      address || null,
      township || null,
      city || "Yangon",
    ];

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

    // Cloudinary မှ ထွက်လာသော URL ကို database ထဲ သိမ်းဆည်းခြင်း
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileUrl = file.path; // 👈 Cloudinary secure URL က ဒီထဲမှာ ပါလာပါတယ်
        await pool.query(
          `INSERT INTO property_images (property_id, image_url, image_type) VALUES ($1, $2, $3)`,
          [newProperty.id, fileUrl, "site_photo"],
        );
      }
    }

    await pool.query("COMMIT");

    const imagesQuery = `SELECT id, image_url AS url, image_type FROM property_images WHERE property_id = $1;`;
    const imagesResult = await pool.query(imagesQuery, [newProperty.id]);
    newProperty.images = imagesResult.rows;

    res.status(201).json({
      success: true,
      message: `Property created successfully! 30 points deducted.`,
      remaining_coins: currentCoins - UPLOAD_POINTS_REQUIRED,
      data: newProperty,
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Create Property Error:", err.message);
    res
      .status(500)
      .json({ error: "Server Error during property creation: " + err.message });
  }
};

// 🔑 ၂။ ဖုန်းနံပါတ်ကြည့်ရန် (20 Coins ဖြတ်ခြင်း နှင့် 7-Day Rule စစ်ခြင်း)
exports.unlockPropertyContact = async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const propertyId = req.params.id;
  const POINTS_REQUIRED = 20; // ဖုန်းနံပါတ်ကြည့်ခ 20 Points

  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized user" });
  }

  try {
    // အိမ်ရှာသူက ၇ ရက်အတွင်း ဖွင့်ဖူးပြီးသားလား စစ်မည်
    const checkUnlock = await pool.query(
      `SELECT * FROM unlocked_contacts 
       WHERE user_id = $1 AND property_id = $2 
       AND unlocked_at >= NOW() - INTERVAL '7 days'`,
      [userId, propertyId],
    );

    // ၇ ရက်အတွင်းဆိုလျှင် Point ထပ်မဖြတ်ဘဲ ဖုန်းနံပါတ် တန်းပြမည်
    if (checkUnlock.rows.length > 0) {
      const propertyQuery = await pool.query(
        "SELECT contact_phone FROM properties WHERE id = $1",
        [propertyId],
      );
      if (propertyQuery.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: "Property not found" });
      }
      return res.json({
        success: true,
        message: "Already unlocked within 7 days (Free)",
        contact_phone: propertyQuery.rows[0].contact_phone,
      });
    }

    // ၇ ရက်ကျော်ပြီ (သို့) ပထမဆုံးအကြိမ်ဆိုလျှင် Point လောက်ရဲ့လား စစ်မည်
    const userQuery = await pool.query(
      "SELECT coins FROM users WHERE id = $1",
      [userId],
    );
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const currentCoins = userQuery.rows[0].coins;
    if (currentCoins < POINTS_REQUIRED) {
      return res
        .status(400)
        .json({ success: false, error: "Coins not enough! Please top up." });
    }

    // Database Transaction စတင်မည်
    await pool.query("BEGIN");

    // အိမ်ရှာသူထံမှ 20 Points ဖြတ်မည်
    await pool.query("UPDATE users SET coins = coins - $1 WHERE id = $2", [
      POINTS_REQUIRED,
      userId,
    ]);

    // unlocked_contacts ထဲသို့ မှတ်တမ်းတင်မည် (သို့မဟုတ် ရှိပြီးသားဆိုလျှင် ရက်စွဲကို Update လုပ်မည်)
    await pool.query(
      `INSERT INTO unlocked_contacts (user_id, property_id, unlocked_at) 
       VALUES ($1, $2, NOW()) 
       ON CONFLICT (user_id, property_id) 
       DO UPDATE SET unlocked_at = NOW()`,
      [userId, propertyId],
    );

    await pool.query("COMMIT");

    // ပို့စ်တင်သူရဲ့ ဖုန်းနံပါတ်ကို ပြန်ပေးမည်
    const propertyQuery = await pool.query(
      "SELECT contact_phone FROM properties WHERE id = $1",
      [propertyId],
    );

    res.json({
      success: true,
      message: "Contact unlocked successfully! 20 points deducted.",
      remaining_coins: currentCoins - POINTS_REQUIRED,
      contact_phone: propertyQuery.rows[0].contact_phone,
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Unlock Contact Error:", err.message);
    res
      .status(500)
      .json({ success: false, error: "Server Error: " + err.message });
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

exports.getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE properties SET views = COALESCE(views, 0) + 1 WHERE id = $1`,
      [id],
    );

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

exports.uploadPropertyFiles = async (req, res) => {
  const { property_id } = req.params;
  const files = req.files;

  try {
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Please select files to upload." });
    }

    const uploadedResults = [];

    for (const file of files) {
      const fileUrl = file.path;

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
      message: "Files uploaded & saved to local storage successfully!",
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

    if (req.files && req.files.length > 0) {
      await pool.query(`DELETE FROM property_images WHERE property_id = $1`, [
        propertyId,
      ]);

      for (const file of req.files) {
        const fileUrl = file.path; // 👈 Cloudinary secure URL ကို သုံးခြင်း
        await pool.query(
          `INSERT INTO property_images (property_id, image_url, image_type) VALUES ($1, $2, $3)`,
          [propertyId, fileUrl, "site_photo"],
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

// 👁️ Property View Count တိုးပေးမည့် Controller
exports.incrementPropertyView = async (req, res) => {
  try {
    const propertyId = req.params.id;

    // အကယ်၍ pool လို့ import လုပ်ထားရင် pool.query သုံးပါ (သို့မဟုတ် db.query လို့ သုံးထားရင် db.query)
    // ဥပမာ - pool.query သို့မဟုတ် db ကို အသုံးပြုခြင်း:
    await pool.query(
      "UPDATE properties SET views = COALESCE(views, 0) + 1 WHERE id = $1",
      [propertyId],
    );

    res
      .status(200)
      .json({ success: true, message: "View count updated successfully" });
  } catch (err) {
    console.error("View increment error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
