const { pool } = require("../config/db");

// 1. Initiate Payment (KBZPay သို့မဟုတ် AYA Pay ငွေပေးချေမှု စတင်ရန်)
exports.initiatePayment = async (req, res) => {
  const { property_id, gateway, amount, phone_number } = req.body;
  const user_id = req.user ? req.user.id : null;

  try {
    // Unique Transaction ID တစ်ခု ဖန်တီးခြင်း
    const transaction_id = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Database ထဲတွင် PENDING အနေဖြင့် မှတ်တမ်းတင်ခြင်း
    const query = `
      INSERT INTO payments (property_id, user_id, gateway, transaction_id, amount, phone_number, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
      RETURNING *;
    `;
    const values = [
      property_id,
      user_id,
      gateway,
      transaction_id,
      amount,
      phone_number,
    ];
    const result = await pool.query(query, values);
    const paymentRecord = result.rows[0];

    // Gateway အလိုက် Mock Response ထုတ်ပေးခြင်း (Production တွင် KBZ/AYA API သို့ ဂျွန်ဆက်ရပါမည်)
    let paymentUrl = "";
    if (gateway === "KBZPay") {
      paymentUrl = `https://uat.kbzpay.com/payment/gateway?tranId=${transaction_id}&amount=${amount}`;
    } else if (gateway === "AYAPay") {
      paymentUrl = `https://sandbox.ayapay.com/checkout?ref=${transaction_id}&amt=${amount}`;
    } else {
      return res
        .status(400)
        .json({ error: "Invalid payment gateway selected." });
    }

    res.status(201).json({
      success: true,
      message: `${gateway} payment initiated successfully.`,
      data: {
        ...paymentRecord,
        payment_url: paymentUrl, // Frontend မှ ဒီ URL သို့မဟုတ် QR သို့ ညွှန်ပေးရပါမည်
      },
    });
  } catch (err) {
    console.error("Initiate Payment Error:", err.message);
    res.status(500).json({ error: "Server error during payment initiation" });
  }
};

// 2. Payment Callback / Webhook (ငွေပေးချေမှု အောင်မြင်သောအခါ Gateway မှ ပြန်လှည့်လာမည့် နေရာ)
exports.paymentCallback = async (req, res) => {
  const { transaction_id, status } = req.body; // SUCCESS သို့မဟုတ် FAILED

  try {
    const updateQuery = `
      UPDATE payments 
      SET status = $1 
      WHERE transaction_id = $2 
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, [status, transaction_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const payment = result.rows[0];

    // ငွေပေးချေမှု အောင်မြင်ပါက သက်ဆိုင်ရာ property ကို Featured သို့မဟုတ် Paid အဖြစ် ပြောင်းလဲနိုင်သည်
    if (status === "SUCCESS" && payment.property_id) {
      await pool.query(
        `UPDATE properties SET status = 'Featured / Paid' WHERE id = $1`,
        [payment.property_id],
      );
    }

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${status}`,
      data: payment,
    });
  } catch (err) {
    console.error("Payment Callback Error:", err.message);
    res.status(500).json({ error: "Server error during payment callback" });
  }
};
