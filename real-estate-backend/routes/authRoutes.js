const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware"); // 👈 protect နှင့် authorize ကို destructure လုပ်ရန်

// Public Routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected Routes (Login ဝင်ထားမှ ရမည်)
router.get("/me", protect, authController.getMe);

// 👑 Admin / Developer သီးသန့် Route ဥပမာ (Admin role ရှိမှသာ ဝင်လို့ရမည်)
router.get(
  "/admin/dashboard-stats",
  protect,
  authorize("admin"),
  (req, res) => {
    res.json({ success: true, message: "Welcome to Admin Dashboard" });
  },
);

module.exports = router;
