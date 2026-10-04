// real-estate-backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");

// Path နာမည်များ /register နှင့် /login ဖြစ်ရပါမည်
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post('/signup', signupController);

module.exports = router;
