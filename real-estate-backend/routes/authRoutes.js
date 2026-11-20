const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const authController = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public Routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected Routes (Login ဝင်ထားမှ ရမည်)
router.get("/me", protect, authController.getMe);

// 👑 Admin Users CRUD Routes
router.get(
  "/admin/users",
  protect,
  authorize("admin"),
  authController.getAllUsers,
);
router.post(
  "/admin/users",
  protect,
  authorize("admin"),
  authController.adminCreateUser,
);
router.put(
  "/admin/users/:id",
  protect,
  authorize("admin"),
  authController.adminUpdateUser,
);
router.put(
  "/admin/users/:id/approve",
  protect,
  authorize("admin"),
  authController.approveAgent,
);
router.delete(
  "/admin/users/:id",
  protect,
  authorize("admin"),
  authController.deleteUser,
);

// Admin can reset user password
router.put(
  "/admin/users/:id/password",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          error: "Password အသစ် ထည့်သွင်းရန် လိုအပ်ပါသည်။",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
        passwordHash,
        id,
      ]);

      res.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: "Server error" });
    }
  },
);

router.get(
  "/admin/dashboard-stats",
  protect,
  authorize("admin"),
  (req, res) => {
    res.json({ success: true, message: "Welcome to Admin Dashboard" });
  },
);

module.exports = router;
