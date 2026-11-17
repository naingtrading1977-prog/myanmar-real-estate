import { useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5002/api";

export default function SignupForm({ onSignupSuccess, switchToLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "client", // 👈 Default အနေဖြင့် client ဟု သတ်မှတ်ထားခြင်း
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: formData.role, // 👈 Backend သို့ role ကို ပို့ပေးခြင်း
        }),
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
        အကောင့်ဖွင့်ရုံဖြင့်{" "}
        <span className="text-emerald-400 font-bold">Free 100 Coins</span>{" "}
        လက်ဆောင်ရယူလိုက်ပါ။
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

        {/* 🤝 အကောင့်အမျိုးအစား (Role) ရွေးချယ်ရန် Dropdown */}
        <div>
          <label className="block text-xs text-slate-300 mb-1">
            အကောင့်အမျိုးအစား (Role)
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="client">
              🏠 အိမ်ရှာသူ (Client - ပို့စ်ကြည့်ရန်နှင့် ဆက်သွယ်ရန်)
            </option>
            <option value="agent">
              🤝 အိမ်ခြံမြေ အကျိုးဆောင် (Agent - ပို့စ်တင်ရန်)
            </option>
          </select>
          {formData.role === "agent" && (
            <p className="text-xs text-amber-400 mt-1.5">
              ⚠️ အကျိုးဆောင်အကောင့်သည် Admin ၏ အတည်ပြုချက် (Approval)
              ရယူပြီးမှသာ ပို့စ်တင်နိုင်မည် ဖြစ်ပါသည်။
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition shadow-lg mt-2 text-sm"
        >
          {loading ? "အကောင့်ဖန်တီးနေသည်..." : "အကောင့်ဖွင့်မည် (Sign Up)"}
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
