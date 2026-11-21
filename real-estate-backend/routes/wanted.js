const express = require("express");
const router = express.Router();
const {
  getWantedListings,
  createWantedListing,
  deleteWantedListing,
} = require("../controllers/wantedController");
const { protect } = require("../middleware/authMiddleware");

// GET /api/wanted - အိမ်ရှာဖွေသူများ စာရင်း ကြည့်ရှုရန်
router.get("/", getWantedListings);

// POST /api/wanted - ဝယ်လို / ငှားလိုကြောင်း စာရင်းအသစ် တင်ရန် (Login ဝင်ထားရန်)
router.post("/", protect, createWantedListing);

// DELETE /api/wanted/:id - ပိုင်ရှင် သို့မဟုတ် Admin မှ စာရင်း ပြန်ဖျက်ရန်
router.delete("/:id", protect, deleteWantedListing);

module.exports = router;
