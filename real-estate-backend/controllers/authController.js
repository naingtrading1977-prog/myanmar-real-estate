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
    const userRole = role || "client";

    // 🔑 အဓိကပြင်ဆင်ချက်: Agent ဖြစ်လျှင် Admin အတည်ပြုချက်လို므로 is_approved = false, Client ဆိုလျှင် true
    const isApproved = userRole === "agent" ? false : true;

    const newUser = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, coins, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, phone, role, coins, is_approved`,
      [name, email, phone || null, passwordHash, userRole, 100, isApproved],
    );

    const createdUser = newUser.rows[0];

    // အကယ်၍ Agent ဖြစ်ပြီး Admin မအတည်ပြုရသေးလျှင် Token မထုတ်ပေးဘဲ သတိပေးချက်ပို့မည်
    if (userRole === "agent" && !createdUser.is_approved) {
      return res.status(201).json({
        success: true,
        pendingApproval: true,
        message:
          "Agent အကောင့်ဖွင့်ခြင်းအောင်မြင်ပါသည်။ Admin ၏ အတည်ပြုချက် (Approval) ရယူပြီးမှသာ Login ဝင်နိုင်မည်ဖြစ်ပါသည်။",
        user: createdUser,
      });
    }

    const token = generateToken(createdUser.id, createdUser.role);

    res.status(201).json({
      success: true,
      token,
      user: createdUser,
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

    const userData = user.rows[0];

    // 🔑 Login ဝင်သည့်အခါ Agent ဖြစ်ပြီး Admin မအတည်ပြုရသေးလျှင် တားမြစ်မည်
    if (userData.role === "agent" && userData.is_approved === false) {
      return res.status(403).json({
        error:
          "သင့်၏ Agent အကောင့်ကို Admin မှ အတည်ပြုပေးဆဲ ဖြစ်ပါသည်။ ကျေးဇူးပြု၍ စောင့်ဆိုင်းပါ။",
      });
    }

    const isMatch = await bcrypt.compare(password, userData.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(userData.id, userData.role);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        coins: userData.coins,
        is_approved: userData.is_approved,
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
      "SELECT id, name, email, phone, role, coins, is_approved FROM users WHERE id = $1",
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
      "SELECT id, name, email, phone, role, coins, payment_proof, is_approved, created_at FROM users ORDER BY id ASC",
      // 👈 ဤနေရာတွင်လည်း is_approved ပါဝင်ရပါမည်
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
    const { coins } = req.body;

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

// 7. Approve Agent (Admin - Approve Agent Account)
exports.approveAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body; // true သို့မဟုတ် false

    const updated = await pool.query(
      "UPDATE users SET is_approved = $1 WHERE id = $2 RETURNING id, name, role, is_approved",
      [is_approved, id],
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, user: updated.rows[0] });
  } catch (err) {
    console.error("ApproveAgent Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 8. Delete User (Admin)
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
