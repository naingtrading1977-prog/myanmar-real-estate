// real-estate-backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");

// Path နာမည်များ /register, /signup နှင့် /login ဖြစ်စေရန်
router.post("/register", registerUser);
router.post("/signup", registerUser); // 👈 ဤနေရာတွင် signup အတွက်ပါ registerUser ကို တွဲပေးလိုက်ပါ
router.post("/login", loginUser);

module.exports = router;
