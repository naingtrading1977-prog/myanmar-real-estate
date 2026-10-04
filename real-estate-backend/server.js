const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const paymentRoutes = require("./routes/paymentRoutes"); // (ဖိုင်ရှိရာ လမ်းကြောင်းမှန်ကန်အောင် စစ်ပါ)

// 👈 Database connectDB ကို import လုပ်ပါ
const { connectDB, pool } = require("./config/db");

const app = express();

app.use(
  cors({
    origin: true, // လာသမျှ Domain တိုင်းကို ခွင့်ပြုသည်
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database connection ကို စတင်ချိတ်ဆက်ပါ
connectDB();

// GET /api/admin/users
app.get("/api/admin/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, role, subscription_status, trial_ends_at, subscription_expires_at FROM users ORDER BY id DESC",
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

// POST /api/admin/users/:id/activate
app.post("/api/admin/users/:id/activate", async (req, res) => {
  const userId = req.params.id;
  try {
    // လက်ရှိအချိန်မှစ၍ ၁ လ (၃၀ ရက်) ထပ်တိုးပေးခြင်း
    const query = `
      UPDATE users 
      SET subscription_status = 'active', 
          subscription_expires_at = NOW() + INTERVAL '1 month'
      WHERE id = $1 
      RETURNING *;
    `;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({
      success: true,
      message: "Subscription activated successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});
// PUT /api/properties/:id/status
app.put("/api/properties/:id/status", async (req, res) => {
  const propertyId = req.params.id;
  const { status } = req.body; // 'Sold', 'Rented', 'Hidden', etc.
  try {
    const query = `UPDATE properties SET status = $1 WHERE id = $2 RETURNING *;`;
    const result = await pool.query(query, [status, propertyId]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Property not found" });
    }

    res.json({
      success: true,
      message: "Property status updated successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

// Routes Registration
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/properties", require("./routes/propertyRoutes"));

// Routes for Payments
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => {
  res.send("Backend API is running...");
});

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5002; // Port 5002 ကို သုံးပါ

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Keep Alive
const keepAlive = setInterval(() => {}, 1000000);

process.on("SIGINT", () => {
  clearInterval(keepAlive);
  server.close(() => process.exit(0));
});
