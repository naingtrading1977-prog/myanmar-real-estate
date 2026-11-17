const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const paymentRoutes = require("./routes/paymentRoutes");
const topupRoutes = require("./routes/topupRoutes");
const { connectDB, pool } = require("./config/db");

const app = express();

app.use(
  cors({
    origin: [
      "https://www.myanmarrealestate.dev",
      "https://myanmar-real-estate.dev",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, "uploads");

// uploads folder မရှိသေးရင် အလိုအလျောက် ဆောက်ပေးရန်
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));

// Database connection ကို စတင်ချိတ်ဆက်ပါ
connectDB();

// 🪙 GET /api/admin/users (Coins စနစ်နှင့် ကိုက်ညီသော User စာရင်းထုတ်ရန်)
app.get("/api/admin/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, role, coins, payment_proof, is_approved, created_at FROM users ORDER BY id ASC",
      // 👈 အပေါ်က query ထဲမှာ is_approved ကို ထည့်ပေးလိုက်ပါ
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

// 🪙 PUT /api/admin/users/:id/coins (Admin မှ User ၏ Coins များကို တိုးမြှင့်/လျှော့ချရန်)
app.put("/api/admin/users/:id/coins", async (req, res) => {
  const userId = req.params.id;
  const { coins } = req.body; // ထည့်မည့် သို့မဟုတ် ဖြတ်မည့် ပမာဏ (+ သို့မဟုတ် -)
  try {
    const query = `
      UPDATE users 
      SET coins = coins + $1 
      WHERE id = $2 
      RETURNING id, name, email, coins;
    `;
    const result = await pool.query(query, [coins, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({
      success: true,
      message: "Coins updated successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

// 🛡️ PUT /api/admin/users/:id/role (Admin မှ User Role ပြောင်းရန်)
app.put("/api/admin/users/:id/role", async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body; // 'user', 'agent', 'admin'
  try {
    const query = `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role;`;
    const result = await pool.query(query, [role, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({
      success: true,
      message: "Role updated successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

// 🗑️ DELETE /api/admin/users/:id (Admin မှ User ဖျက်ရန်)
app.delete("/api/admin/users/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

// 🏠 PUT /api/properties/:id/status (Property Status ပြောင်းရန် - Available, Sold, Rented, Hidden)
app.put("/api/properties/:id/status", async (req, res) => {
  const propertyId = req.params.id;
  const { status } = req.body;
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
app.use("/api/topup", topupRoutes);

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

const PORT = process.env.PORT || 5002;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Keep Alive
const keepAlive = setInterval(() => {}, 1000000);

process.on("SIGINT", () => {
  clearInterval(keepAlive);
  server.close(() => process.exit(0));
});
