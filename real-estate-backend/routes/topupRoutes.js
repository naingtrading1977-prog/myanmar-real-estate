const express = require("express");
const router = express.Router();
const { handleKPayWebhook } = require("../controllers/topupController");

// SMS Forwarder App မှ POST request လှမ်းတင်မည့် Endpoint
router.post("/webhook/kpay", handleKPayWebhook);

module.exports = router;
