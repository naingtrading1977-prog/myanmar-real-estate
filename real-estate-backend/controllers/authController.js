const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

const normalizeMyanmarPhone = (rawPhone) => {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (digits.startsWith("959") && digits.length >= 10) {
    return `+${digits}`;
  }
  if (digits.startsWith("09") && digits.length >= 10) {
    return `+95${digits.slice(1)}`;
  }
  if (digits.startsWith("9") && digits.length >= 9) {
    return `+95${digits}`;
  }
  return null;
};

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
    if (!email || !password || !name || !phone) {
      return res.status(400).json({
        success: false,
        error:
          "နာမည်၊ အီးမေးလ်၊ ဖုန်းနံပါတ်နှင့် စကားဝှက် အားလုံး ဖြည့်သွင်းပါ။",
      });
    }

    const normalizedPhone = normalizeMyanmarPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        error: "မှန်ကန်သော မြန်မာဖုန်းနံပါတ် (ဥပမာ - 09784970257) ထည့်သွင်းပါ။",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Email ရှိပြီးသား ဟုတ်/မဟုတ် စစ်ဆေးခြင်း
    const emailExists = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = $1",
      [cleanEmail],
    );
    if (emailExists.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "ဤအီးမေးလ်ဖြင့် အကောင့်ဖွင့်ပြီးသား ဖြစ်နေပါသည်။",
      });
    }

    // ဖုန်းနံပါတ်တစ်ခုအတွက် Account တစ်ခုသာ ခွင့်ပြုရန် စစ်ဆေးခြင်း
    const phoneExists = await pool.query(
      "SELECT id FROM users WHERE phone = $1",
      [normalizedPhone],
    );
    if (phoneExists.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error:
          "ဤဖုန်းနံပါတ်ဖြင့် အကောင့်ဖွင့်ပြီးသား ဖြစ်ပါသည်။ ဖုန်းနံပါတ်တစ်ခုလျှင် အကောင့်တစ်ခုသာ ဖွင့်ခွင့်ရှိပါသည်။",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userRole = role === "agent" ? "agent" : "client";

    // Agent ဖြစ်လျှင် Admin အတည်ပြုချက်လို으므로 is_approved = false, Client ဆိုလျှင် true
    const isApproved = userRole === "agent" ? false : true;

    const newUser = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, coins, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, phone, role, coins, is_approved`,
      [
        name.trim(),
        cleanEmail,
        normalizedPhone,
        passwordHash,
        userRole,
        100,
        isApproved,
      ],
    );

    const createdUser = newUser.rows[0];

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
    // PostgreSQL UNIQUE constraint violation (ဥပမာ users_phone_unique)
    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        error:
          "ဤဖုန်းနံပါတ် သို့မဟုတ် အီးမေးလ်ဖြင့် အကောင့်ဖွင့်ပြီးသား ဖြစ်နေပါသည်။",
      });
    }

    console.error("Register Error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message || "Server Error during registration",
    });
  }
};

// 2. User Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();
    const user = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = $1",
      [cleanEmail],
    );

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
    if (req.user && Number(id) === Number(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: "မိမိအသုံးပြုနေသော Admin အကောင့်ကို ကိုယ်တိုင် ဖျက်၍မရပါ။",
      });
    }
    const deleted = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id],
    );
    if (deleted.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("DeleteUser Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👑 Admin: Create New User (C - Create)
exports.adminCreateUser = async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    role,
    coins = 100,
    is_approved,
  } = req.body;

  try {
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        error:
          "နာမည်၊ အီးမေးလ်၊ ဖုန်းနံပါတ်နှင့် စကားဝှက် ထည့်သွင်းရန် လိုအပ်ပါသည်။",
      });
    }

    const normalizedPhone = normalizeMyanmarPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        error: "မှန်ကန်သော မြန်မာဖုန်းနံပါတ် (09xxxxxxxxx) ထည့်သွင်းပါ။",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const validRoles = ["client", "agent", "admin"];
    const userRole = validRoles.includes(role) ? role : "client";
    const approvedStatus =
      typeof is_approved === "boolean"
        ? is_approved
        : userRole === "agent"
          ? false
          : true;

    const existing = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = $1 OR phone = $2",
      [cleanEmail, normalizedPhone],
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error:
          "ဤအီးမေးလ် သို့မဟုတ် ဖုန်းနံပါတ်ဖြင့် အကောင့်ရှိပြီးသား ဖြစ်ပါသည်။",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const created = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, coins, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, phone, role, coins, is_approved, created_at`,
      [
        name.trim(),
        cleanEmail,
        normalizedPhone,
        passwordHash,
        userRole,
        Number(coins) || 0,
        approvedStatus,
      ],
    );

    res.status(201).json({
      success: true,
      message: "User အကောင့်အသစ် ဖန်တီးပြီးပါပြီ။",
      data: created.rows[0],
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        error: "အီးမေးလ် သို့မဟုတ် ဖုန်းနံပါတ် ထပ်နေပါသည်။",
      });
    }
    console.error("AdminCreateUser Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👑 Admin: Update User Info (U - Update Profile / Role / Coins / Approval)
exports.adminUpdateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role, coins, is_approved } = req.body;

  try {
    const currentRes = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    const existingUser = currentRes.rows[0];

    let nextPhone = existingUser.phone;
    if (phone !== undefined && String(phone).trim() !== "") {
      const normalized = normalizeMyanmarPhone(phone);
      if (!normalized) {
        return res.status(400).json({
          success: false,
          error: "မှန်ကန်သော မြန်မာဖုန်းနံပါတ် ထည့်သွင်းပါ။",
        });
      }
      const phoneDup = await pool.query(
        "SELECT id FROM users WHERE phone = $1 AND id <> $2",
        [normalized, id],
      );
      if (phoneDup.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: "ဤဖုန်းနံပါတ်ကို အခြားအကောင့်တွင် အသုံးပြုပြီးသား ဖြစ်ပါသည်။",
        });
      }
      nextPhone = normalized;
    }

    let nextEmail = existingUser.email;
    if (email !== undefined && String(email).trim() !== "") {
      const cleanEmail = email.trim().toLowerCase();
      const emailDup = await pool.query(
        "SELECT id FROM users WHERE LOWER(email) = $1 AND id <> $2",
        [cleanEmail, id],
      );
      if (emailDup.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: "ဤအီးမေးလ်ကို အခြားအကောင့်တွင် အသုံးပြုပြီးသား ဖြစ်ပါသည်။",
        });
      }
      nextEmail = cleanEmail;
    }

    const nextName =
      name !== undefined && String(name).trim() !== ""
        ? name.trim()
        : existingUser.name;
    const validRoles = ["client", "agent", "admin"];
    const nextRole = validRoles.includes(role) ? role : existingUser.role;
    const nextCoins =
      coins !== undefined && !Number.isNaN(Number(coins))
        ? Number(coins)
        : existingUser.coins;
    const nextApproved =
      typeof is_approved === "boolean" ? is_approved : existingUser.is_approved;

    const updated = await pool.query(
      `UPDATE users
       SET name = $1, email = $2, phone = $3, role = $4, coins = $5, is_approved = $6
       WHERE id = $7
       RETURNING id, name, email, phone, role, coins, is_approved, created_at`,
      [nextName, nextEmail, nextPhone, nextRole, nextCoins, nextApproved, id],
    );

    res.json({
      success: true,
      message: "User အချက်အလက်များ ပြင်ဆင်ပြီးပါပြီ။",
      data: updated.rows[0],
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        error: "အီးမေးလ် သို့မဟုတ် ဖုန်းနံပါတ် ထပ်နေပါသည်။",
      });
    }
    console.error("AdminUpdateUser Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
