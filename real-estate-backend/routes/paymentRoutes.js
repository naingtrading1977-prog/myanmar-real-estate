const express = require("express");
const router = express.Router();
const {
  initiatePayment,
  paymentCallback,
} = require("../controllers/paymentController");
// 🔍 verifyToken အစား protect ကို သုံးပါ
const { protect } = require("../middleware/authMiddleware");

// protect ကို ဤကဲ့သို့ ထည့်သွင်းပါ
router.post("/pay", protect, initiatePayment);
router.post("/callback", paymentCallback);

module.exports = router;
