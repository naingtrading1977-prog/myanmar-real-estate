import React, { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://myanmar-real-estate-1.onrender.com/api";

export default function SignupForm({ onSignupSuccess, switchToLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "client",
    plan: "trial",
  });

  const [paymentProof, setPaymentProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setPaymentProof(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const dataToSend = new FormData();
      dataToSend.append("name", formData.name);
      dataToSend.append("email", formData.email);
      dataToSend.append("password", formData.password);
      dataToSend.append("phone", formData.phone);
      dataToSend.append("role", formData.role);
      dataToSend.append("plan", formData.plan);

      if (formData.plan === "paid" && paymentProof) {
        dataToSend.append("payment_proof", paymentProof);
      }

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        body: dataToSend,
      });
      const data = await response.json();

      if (response.ok) {
        if (onSignupSuccess) onSignupSuccess(data);
      } else {
        setError(
          data.message || data.error || "အကောင့်ဖွင့်ခြင်း မအောင်မြင်ပါ။",
        );
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("ဆာဗာသို့ ချိတ်ဆက်၍ မရပါ။");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 p-6 md:p-8 rounded-2xl shadow-xl max-w-xl w-full mx-auto border border-slate-800 max-h-[85vh] overflow-y-auto custom-scrollbar">
      <h2 className="text-2xl font-bold mb-1 text-center text-white">
        အကောင့်အသစ်ဖွင့်ရန်
      </h2>
      <p className="text-xs md:text-sm text-slate-400 text-center mb-6">
        သင့်လုပ်ငန်းအတွက် အသင့်တော်ဆုံး ပလန်ကို ရွေးချယ်ပြီး စတင်လိုက်ပါ။
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1">နာမည်</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="သင့်နာမည်ထည့်ပါ"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">
              ဖုန်းနံပါတ်
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="09XXXXXXXXX"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-300 mb-1">
            အီးမေးလ် (Email)
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            placeholder="example@gmail.com"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-300 mb-1">
            စကားဝှက် (Password)
          </label>
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            placeholder="••••••••"
          />
        </div>

        {/* Subscription Plan Selection */}
        <div>
          <label className="block text-xs font-medium mb-2 text-slate-300">
            ပလန် (Subscription Plan) ရွေးချယ်ရန်
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setFormData({ ...formData, plan: "trial" })}
              className={`border p-3 rounded-xl cursor-pointer transition ${
                formData.plan === "trial"
                  ? "border-emerald-500 bg-emerald-500/10 text-white"
                  : "border-slate-700 bg-slate-800 text-slate-400"
              }`}
            >
              <div className="font-semibold text-sm">Trial Plan</div>
              <div className="text-xs mt-1">၁ လ အခမဲ့</div>
            </div>

            <div
              onClick={() => setFormData({ ...formData, plan: "paid" })}
              className={`border p-3 rounded-xl cursor-pointer transition ${
                formData.plan === "paid"
                  ? "border-emerald-500 bg-emerald-500/10 text-white"
                  : "border-slate-700 bg-slate-800 text-slate-400"
              }`}
            >
              <div className="font-semibold text-sm">Paid Plan</div>
              <div className="text-xs mt-1">၁၅,၀၀၀ ကျပ် / ၂ လစာ</div>
            </div>
          </div>
        </div>

        {/* 🛠️ Paid Plan ရွေးထားမှသာ ငွေလွှဲပြေစာ (Payment Proof) တင်ရန် နေရာပေါ်လာမည် */}
        {formData.plan === "paid" && (
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-2">
            <label className="block text-xs font-medium text-emerald-400">
              ငွေလွှဲပြေစာ (Payment Screenshot) တင်ရန်
            </label>
            <p className="text-[11px] text-slate-400">
              KBZPay / WaveMoney ဖြင့် ငွေလွှဲထားသော Screenshot ပုံကို
              ထည့်ပေးပါရန်။
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
              className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition shadow-lg mt-2 text-sm"
        >
          {loading ? "အကောင့်ဖန်တီးနေသည်..." : "ငွေပေးချေပြီး အကောင့်ဖွင့်မည်"}
        </button>
      </form>

      <div className="text-center mt-5 pt-3 border-t border-slate-800 text-sm text-slate-400">
        အကောင့်ရှိပြီးသားလား?{" "}
        <button
          onClick={switchToLogin}
          className="text-emerald-400 hover:underline font-semibold ml-1"
        >
          အကောင့်ဝင်ရန် (Login)
        </button>
      </div>
    </div>
  );
}
