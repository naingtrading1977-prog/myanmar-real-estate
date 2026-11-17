const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

// JWT Token ထုတ်ပေးသည့် Helper
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// 1. User Register
exports.register = async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  try {
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Please fill in all required fields" });
    }

    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    if (userExists.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userRole = role || "user";

    const newUser = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, coins)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, role, coins`,
      [name, email, phone || null, passwordHash, userRole, 100],
    );

    const token = generateToken(newUser.rows[0].id, newUser.rows[0].role);

    res.status(201).json({
      success: true,
      token,
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error("Register Error:", err.message);
    res
      .status(500)
      .json({ error: err.message || "Server Error during registration" });
  }
};

// 2. User Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user.rows[0].id, user.rows[0].role);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        phone: user.rows[0].phone,
        role: user.rows[0].role,
        coins: user.rows[0].coins,
      },
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ error: err.message || "Server Error during login" });
  }
};

// 3. Get Current User Profile (/me)
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT id, name, email, phone, role, coins FROM users WHERE id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("GetMe Error:", err.message);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// ==========================================
// 👑 ADMIN CONTROLLERS (For Admin Dashboard)
// ==========================================

// 4. Get All Users (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, role, coins, payment_proof, created_at FROM users ORDER BY id ASC",
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("GetAllUsers Error:", err.message);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// 5. Update User Coins (Admin - Add / Deduct)
exports.updateUserCoins = async (req, res) => {
  try {
    const { id } = req.params;
    const { coins } = req.body; // ဝင်လာမည့် ပမာဏ (+ သို့မဟုတ် -)

    const updated = await pool.query(
      "UPDATE users SET coins = coins + $1 WHERE id = $2 RETURNING id, name, coins",
      [coins, id],
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, user: updated.rows[0] });
  } catch (err) {
    console.error("UpdateCoins Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 6. Update User Role (Admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const updated = await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, role",
      [role, id],
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, user: updated.rows[0] });
  } catch (err) {
    console.error("UpdateRole Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 7. Delete User (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("DeleteUser Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
