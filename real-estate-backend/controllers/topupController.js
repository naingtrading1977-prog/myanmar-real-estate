const { pool } = require("../config/db");
// 🪙 SMS Webhook / Top-up Automation Controller
exports.handleKPayWebhook = async (req, res) => {
  const { sender, message, amount } = req.body;
  // ဥပမာ: message ထဲတွင် "Successfully transferred 10000 MMK. Note: user_5" ဟု ပါလာမည်။

  try {
    if (!message) {
      return res
        .status(400)
        .json({ success: false, error: "SMS message is required" });
    }

    // ၁။ Message ထဲမှ User ID သို့မဟုတ် Username ကို Regex ဖြင့် ရှာဖွေခြင်း (ဥပမာ - user_5 သို့မဟုတ် id:5)
    const userIdMatch =
      message.match(/user_(\d+)/i) || message.match(/id[:\s]?(\d+)/i);

    if (!userIdMatch) {
      return res.status(400).json({
        success: false,
        error: "User ID not found in transaction note.",
      });
    }

    const userId = userIdMatch[1];

    // ၂။ ငွေပမာဏအပေါ်မူတည်၍ Coins တွက်ချက်ခြင်း (ဥပမာ - 1,000 ကျပ် = 10 Coins သို့မဟုတ် 1 ကျပ် = 1 Coin)
    // ဤနေရာတွင် KPay SMS ထဲပါလာသော ငွေပမာဏ (သို့တਸမို့ Request ထဲပါလာသော amount) ကို တွက်ချက်နိုင်သည်
    const transferAmount = parseFloat(amount) || 1000; // Default 1000 MMK
    const creditedCoins = Math.floor(transferAmount / 100); // ယူနစ်နှုန်း (ဥပမာ - 100 ကျပ် = 1 Coin)

    // ၃။ Database ထဲတွင် သက်ဆိုင်ရာ User ကို ရှာပြီး Coins ပေါင်းထည့်ခြင်း
    // (PostgreSQL Query ဥပမာ)
    const updateQuery = `
      UPDATE users 
      SET coins = COALESCE(coins, 0) + $1 
      WHERE id = $2 
      RETURNING id, email, coins;
    `;

    const dbResult = await pool.query(updateQuery, [creditedCoins, userId]);

    if (dbResult.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, error: "User not found in database." });
    }

    const updatedUser = dbResult.rows[0];

    console.log(
      `✅ Success: Added ${creditedCoins} coins to User ID ${userId}`,
    );

    return res.status(200).json({
      success: true,
      message: `Successfully credited ${creditedCoins} coins to user ${updatedUser.email}`,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Topup Webhook Error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error during top-up." });
  }
};
