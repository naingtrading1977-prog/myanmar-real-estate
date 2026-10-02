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
exports.registerUser = async (req, res) => {
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
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, role`,
      [name, email, phone || null, passwordHash, userRole],
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
// 2. User Login
exports.loginUser = async (req, res) => {
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

    // 🛠️ အရေးကြီးသည်: ဤနေရာတွင် token အပြင် user object ကိုပါ သေချာ ပို့ပေးရန် လိုအပ်သည်
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        phone: user.rows[0].phone,
        role: user.rows[0].role,
      },
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ error: err.message || "Server Error during login" });
  }
};
