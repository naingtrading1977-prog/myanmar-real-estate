import { useState } from "react";
import { useDispatch } from "react-redux";
import SignupForm from "./SignupForm";
import { loginUser } from "../store/authSlice";

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  language,
}) {
  const dispatch = useDispatch();
  const lang = language || localStorage.getItem("app_lang") || "mm";

  const [isLoginView, setIsLoginView] = useState(true);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const t = {
    loginTitle: lang === "en" ? "Login" : "အကောင့်ဝင်ရန် (Login)",
    loginSubtitle:
      lang === "en"
        ? "Sign in to view and list properties."
        : "အိမ်ခြံမြေများကို ကြည့်ရှုရန်နှင့် တင်ရန် အကောင့်ဝင်ပါ။",
    emailLabel: lang === "en" ? "Email" : "အီးမေးလ် (Email)",
    passwordLabel: lang === "en" ? "Password" : "စကားဝှက် (Password)",
    checking: lang === "en" ? "Signing in..." : "စစ်ဆေးနေသည်...",
    loginBtn: lang === "en" ? "Login" : "အကောင့်ဝင်မည်",
    noAccount:
      lang === "en" ? "Don't have an account?" : "အကောင့်မရှိသေးဘူးလား?",
    signupLink: lang === "en" ? "Sign Up" : "အကောင့်အသစ်ဖွင့်ရန် (Signup)",
    loginFailed:
      lang === "en"
        ? "Login failed. Please check your credentials or server."
        : "အကောင့်ဝင်ရောက်ခြင်း မအောင်မြင်ပါ။ ဆာဗာသို့ ချိတ်ဆက်၍ မရပါ။",
  };

  const handleCloseModal = () => {
    setError("");
    setIsLoginView(true);
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await dispatch(
        loginUser({
          email: loginData.email.trim(),
          password: loginData.password,
        }),
      ).unwrap();

      setLoginData({ email: "", password: "" });

      if (typeof onAuthSuccess === "function") {
        onAuthSuccess(data);
      }
      if (typeof onClose === "function") {
        onClose();
      }
    } catch (errMsg) {
      console.error("Login error:", errMsg);
      setError(typeof errMsg === "string" ? errMsg : t.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={handleCloseModal}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md"
      >
        <button
          type="button"
          onClick={handleCloseModal}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 text-xl font-bold bg-slate-800/70 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
        >
          ✕
        </button>

        {isLoginView ? (
          <div className="bg-slate-900 text-slate-100 p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-800">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center text-white">
              {t.loginTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 text-center mb-6">
              {t.loginSubtitle}
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs sm:text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm text-slate-300 mb-1">
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={loginData.email}
                  onChange={handleLoginChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="example@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-slate-300 mb-1">
                  {t.passwordLabel}
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={loginData.password}
                  onChange={handleLoginChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition shadow-lg mt-2 cursor-pointer"
              >
                {loading ? t.checking : t.loginBtn}
              </button>
            </form>

            <div className="text-center mt-4 text-xs sm:text-sm text-slate-400">
              {t.noAccount}{" "}
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setIsLoginView(false);
                }}
                className="text-emerald-400 hover:underline font-medium cursor-pointer"
              >
                {t.signupLink}
              </button>
            </div>
          </div>
        ) : (
          <SignupForm
            onSignupSuccess={() => {
              setError("");
              setIsLoginView(true);
            }}
            switchToLogin={() => {
              setError("");
              setIsLoginView(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
