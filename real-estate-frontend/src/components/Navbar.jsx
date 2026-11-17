import { useState } from "react";
import { Link } from "react-router-dom";
import CustomModal from "./CustomModal"; // 👈 Modal Component ကို Import လုပ်ရန်

const Navbar = ({
  user,
  isAuthenticated,
  onLogout,
  onOpenAuth,
  onOpenPostModal,
}) => {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserName = user?.name || storedUser?.name || "အသုံးပြုသူ";
  const currentUserRole = user?.role || storedUser?.role || "client";
  const isUserApproved = user?.is_approved ?? storedUser?.is_approved ?? false;

  // 🌟 Modal State များ
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });

  const getRoleDisplayName = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "စီမံခန့်ခွဲသူ";
      case "agent":
        return "အိမ်ခြံမြေကိုယ်စားလှယ်";
      case "client":
        return "သုံးစွဲသူ";
      default:
        return role || "အသုံးပြုသူ";
    }
  };

  // 🛡️ ပို့စ်တင်ရန် ခလုတ်ကို နှိပ်သည့်အခါ Custom Modal ဖြင့် သတိပေးရန်
  const handlePostClick = () => {
    if (
      currentUserRole === "admin" ||
      (currentUserRole === "agent" && isUserApproved)
    ) {
      onOpenPostModal();
    } else {
      setModalConfig({
        isOpen: true,
        title: "ဝမ်းနည်းပါတယ်၊ တင်ခွင့်မရှိပါ",
        message:
          "Agent အကောင့်ဖြင့် Admin ၏ အတည်ပြုချက် (Approval) ရရှိထားမှသာ အိမ်ခြံမြေ ပို့စ်တင်ခွင့် ရှိပါသည်။",
        type: "error",
      });
    }
  };

  return (
    <>
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-sm border-b border-slate-200 py-4 px-6 md:px-8 flex justify-between items-center transition-all">
        <Link
          to="/"
          className="text-lg md:text-xl font-extrabold text-emerald-600 flex items-center gap-2 hover:text-emerald-700 transition"
        >
          <span>🏠</span> WIN WIN AUNG{" "}
          <span className="text-xs md:text-sm font-semibold text-slate-600 hidden sm:inline">
            ( အိမ်ခြံမြေ အကျိုးတော်ဆောင် )
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <button
                onClick={handlePostClick}
                className="px-3.5 py-2 text-xs md:text-sm font-semibold bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition active:scale-95 flex items-center gap-1"
              >
                <span>+</span> ပို့စ်တင်ရန်
              </button>

              <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-sm shadow-inner">
                  {currentUserName
                    ? currentUserName.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-medium text-slate-500">
                    မင်္ဂလာပါ၊
                  </span>
                  <span className="text-sm font-bold text-slate-900 leading-tight">
                    {currentUserName}
                  </span>
                </div>

                <span className="ml-1 px-2.5 py-1 text-[11px] bg-emerald-100 text-emerald-800 rounded-full font-semibold uppercase tracking-wide border border-emerald-200">
                  {getRoleDisplayName(currentUserRole)}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="px-3.5 py-2 text-xs md:text-sm font-medium bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
              >
                ထွက်ရန်
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 md:px-5 py-2 text-xs md:text-sm font-semibold bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition"
            >
              အကောင့်ဝင်ရန် / အသစ်ပြုလုပ်ရန်
            </button>
          )}
        </div>
      </header>

      {/* 🌟 Custom Modern Pro Modal Component */}
      <CustomModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
    </>
  );
};

export default Navbar;
