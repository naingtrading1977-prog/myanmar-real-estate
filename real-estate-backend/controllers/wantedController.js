const dbModule = require("../config/db");

const db = {
  query: (text, params) => {
    if (typeof dbModule?.query === "function") {
      return dbModule.query(text, params);
    }
    if (typeof dbModule?.pool?.query === "function") {
      return dbModule.pool.query(text, params);
    }
    if (typeof dbModule?.default?.query === "function") {
      return dbModule.default.query(text, params);
    }
    if (typeof dbModule === "function") {
      return dbModule(text, params);
    }
    throw new Error("PostgreSQL query client/pool not found in ../config/db");
  },
};

// GET /api/wanted - ဝယ်လို/ငှားလိုသူ စာရင်းများ ကြည့်ရှုရန် (filter / search ပါဝင်သည်)
const getWantedListings = async (req, res) => {
  try {
    const { type, category, search } = req.query;
    const conditions = [];
    const values = [];

    if (type === "Buy" || type === "Rent") {
      values.push(type);
      conditions.push(`w.request_type = $${values.length}`);
    }

    if (category && category.trim()) {
      values.push(category.trim());
      conditions.push(`w.property_type = $${values.length}`);
    }

    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      const idx = values.length;
      conditions.push(
        `(w.township ILIKE $${idx} OR w.city ILIKE $${idx} OR w.budget ILIKE $${idx} OR w.notes ILIKE $${idx} OR w.contact_name ILIKE $${idx} OR w.property_type ILIKE $${idx})`,
      );
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await db.query(
      `SELECT
         w.id,
         w.user_id,
         w.request_type,
         w.property_type,
         w.township,
         w.city,
         w.budget,
         COALESCE(NULLIF(TRIM(w.contact_name), ''), u.name, 'ရှာဖွေသူ') AS contact_name,
         COALESCE(NULLIF(TRIM(w.contact_phone), ''), u.phone, '') AS contact_phone,
         w.notes,
         w.created_at
       FROM wanted_listings w
       LEFT JOIN users u ON w.user_id = u.id
       ${whereClause}
       ORDER BY w.created_at DESC, w.id DESC`,
      values,
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error("Error in getWantedListings:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wanted listings",
    });
  }
};

// POST /api/wanted - ဝယ်လို/ငှားလိုကြောင်း စာရင်းအသစ် တင်ရန်
const createWantedListing = async (req, res) => {
  try {
    const {
      request_type,
      property_type,
      township,
      city,
      budget,
      contact_name,
      contact_phone,
      notes,
    } = req.body;

    if (!["Buy", "Rent"].includes(request_type)) {
      return res.status(400).json({
        success: false,
        message: "request_type must be either 'Buy' or 'Rent'",
      });
    }

    if (!property_type || !String(property_type).trim()) {
      return res.status(400).json({
        success: false,
        message: "property_type is required",
      });
    }

    if (!township || !String(township).trim()) {
      return res.status(400).json({
        success: false,
        message: "township is required",
      });
    }

    const userId = req.user?.id || req.user?._id || null;

    const result = await db.query(
      `INSERT INTO wanted_listings (
         user_id,
         request_type,
         property_type,
         township,
         city,
         budget,
         contact_name,
         contact_phone,
         notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        request_type,
        String(property_type).trim(),
        String(township).trim(),
        city && String(city).trim() ? String(city).trim() : "ရန်ကုန်",
        budget && String(budget).trim() ? String(budget).trim() : "ညှိနှိုင်း",
        contact_name && String(contact_name).trim()
          ? String(contact_name).trim()
          : req.user?.name || "ရှာဖွေသူ",
        contact_phone && String(contact_phone).trim()
          ? String(contact_phone).trim()
          : req.user?.phone || "",
        notes && String(notes).trim() ? String(notes).trim() : "",
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Wanted listing created successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error in createWantedListing:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create wanted listing",
    });
  }
};

// DELETE /api/wanted/:id - ပိုင်ရှင် သို့မဟုတ် Admin မှ Wanted listing ပြန်ဖျက်ရန်
const deleteWantedListing = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid wanted listing ID",
      });
    }

    const existing = await db.query(
      "SELECT id, user_id FROM wanted_listings WHERE id = $1",
      [id],
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Wanted listing not found",
      });
    }

    const item = existing.rows[0];
    const currentUserId = req.user?.id || req.user?._id;
    const isAdmin = req.user?.role === "admin" || Boolean(req.user?.isAdmin);

    if (
      item.user_id &&
      currentUserId &&
      String(item.user_id) !== String(currentUserId) &&
      !isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this listing",
      });
    }

    await db.query("DELETE FROM wanted_listings WHERE id = $1", [id]);

    return res.status(200).json({
      success: true,
      message: "Wanted listing deleted successfully",
    });
  } catch (err) {
    console.error("Error in deleteWantedListing:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete wanted listing",
    });
  }
};

module.exports = {
  getWantedListings,
  createWantedListing,
  deleteWantedListing,
};
