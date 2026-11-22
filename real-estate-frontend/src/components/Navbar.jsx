import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import CustomModal from "./CustomModal";

const parseStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const Navbar = ({
  user,
  isAuthenticated,
  onLogout,
  onOpenAuth,
  onOpenPostModal,
  onSelectCategory,
  language,
  onChangeLanguage,
}) => {
  const navigate = useNavigate();
  const navRef = useRef(null);

  const [lang, setLang] = useState(
    language || localStorage.getItem("app_lang") || "mm",
  );

  useEffect(() => {
    if (language && language !== lang) {
      setLang(language);
    }
  }, [language, lang]);

  const handleToggleLang = (nextLang) => {
    setLang(nextLang);
    localStorage.setItem("app_lang", nextLang);
    if (typeof onChangeLanguage === "function") {
      onChangeLanguage(nextLang);
    }
  };

  const storedUser = parseStoredUser();
  const currentUserName =
    user?.name || storedUser?.name || (lang === "en" ? "User" : "အသုံးပြုသူ");
  const currentUserRole = user?.role || storedUser?.role || "client";
  const isUserApproved = user?.is_approved ?? storedUser?.is_approved ?? false;

  const [openMenu, setOpenMenu] = useState(null);

  // အပြင်ဘက် တစ်နေရာရာ click နှိပ်ရင် dropdown ပိတ်ရန်
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });

  const t = {
    tagline:
      lang === "en"
        ? "( Real Estate Agent Support Platform )"
        : "( အိမ်ခြံမြေ အကျိုးတော်ဆောင် အထောက်ကူပြု Platform )",
    postBtn: lang === "en" ? "Post Listing" : "ပို့စ်တင်ရန်",
    greeting: lang === "en" ? "Welcome," : "မင်္ဂလာပါ၊",
    logout: lang === "en" ? "Logout" : "ထွက်ရန်",
    authBtnDesktop:
      lang === "en" ? "Login / Sign Up" : "အကောင့်ဝင်ရန် / အသစ်ပြုလုပ်ရန်",
    authBtnMobile: lang === "en" ? "Login / Sign Up" : "အကောင့်ဝင်ရန်",
    noPermissionTitle:
      lang === "en" ? "Permission Denied" : "ဝမ်းနည်းပါတယ်၊ တင်ခွင့်မရှိပါ",
    noPermissionMsg:
      lang === "en"
        ? "Only approved Agent accounts or Admins can publish property listings."
        : "Agent အကောင့်ဖြင့် Admin ၏ အတည်ပြုချက် (Approval) ရရှိထားမှသာ အိမ်ခြံမြေ ပို့စ်တင်ခွင့် ရှိပါသည်။",
  };

  const getRoleDisplayName = (role) => {
    const r = role?.toLowerCase();
    if (lang === "en") {
      switch (r) {
        case "admin":
          return "Admin";
        case "agent":
          return "Agent";
        case "client":
          return "Client";
        default:
          return role || "User";
      }
    }
    switch (r) {
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

  const handlePostClick = () => {
    if (
      currentUserRole === "admin" ||
      (currentUserRole === "agent" && isUserApproved)
    ) {
      if (typeof onOpenPostModal === "function") {
        onOpenPostModal();
      }
    } else {
      setModalConfig({
        isOpen: true,
        title: t.noPermissionTitle,
        message: t.noPermissionMsg,
        type: "error",
      });
    }
  };

  const handleFilterNavigate = ({ listingType = "", category = "" }) => {
    setOpenMenu(null);
    if (typeof onSelectCategory === "function") {
      onSelectCategory({ listingType, category });
    }
    const params = new URLSearchParams();
    if (listingType) params.set("type", listingType);
    if (category) params.set("category", category);
    const queryString = params.toString();
    navigate(queryString ? `/?${queryString}` : "/");
  };

  const handleWantedNavigate = ({ type = "", openPost = false } = {}) => {
    setOpenMenu(null);
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (openPost) params.set("openPost", "1");
    const qs = params.toString();
    navigate(qs ? `/wanted?${qs}` : "/wanted");
  };

  const navItems = [
    {
      key: "home",
      label: lang === "en" ? "Home" : "ပင်မ",
      icon: "🏠",
      onClick: () => handleFilterNavigate({ listingType: "", category: "" }),
      children: null,
    },
    {
      key: "sale",
      label: lang === "en" ? "For Sale" : "ရောင်းရန်",
      icon: "🏷️",
      children: [
        {
          label:
            lang === "en"
              ? "All Properties for Sale"
              : "ရောင်းရန် အိမ်ခြံမြေများ (အားလုံး)",
          listingType: "Sale",
          category: "",
        },
        {
          label: lang === "en" ? "Apartment / Condo" : "တိုက်ခန်း / ကွန်ဒို",
          listingType: "Sale",
          category: "Apartment",
        },
        {
          label: lang === "en" ? "House / Compound" : "လုံးချင်းအိမ် / ခြံမြေ",
          listingType: "Sale",
          category: "House",
        },
        {
          label: lang === "en" ? "Land Plots" : "မြေကွက်များ",
          listingType: "Sale",
          category: "Land",
        },
        {
          label: lang === "en" ? "Commercial / Office" : "ဆိုင်ခန်း / ရုံးခန်း",
          listingType: "Sale",
          category: "Commercial",
        },
        {
          label: lang === "en" ? "Restaurant" : "စားသောက်ဆိုင်",
          listingType: "Sale",
          category: "Restaurant",
        },
      ],
    },
    {
      key: "rent",
      label: lang === "en" ? "For Rent" : "ငှားရန်",
      icon: "🔑",
      children: [
        {
          label:
            lang === "en"
              ? "All Properties for Rent"
              : "ငှားရန် အိမ်ခြံမြေများ (အားလုံး)",
          listingType: "Rent",
          category: "",
        },
        {
          label:
            lang === "en" ? "Apartment / Condo" : "ငှားရန် တိုက်ခန်း / ကွန်ဒို",
          listingType: "Rent",
          category: "Apartment",
        },
        {
          label: lang === "en" ? "House for Rent" : "ငှားရန် လုံးချင်းအိမ်",
          listingType: "Rent",
          category: "House",
        },
        {
          label: lang === "en" ? "Commercial / Office" : "ဆိုင်ခန်း / ရုံးခန်း",
          listingType: "Rent",
          category: "Commercial",
        },
        {
          label: lang === "en" ? "Restaurant" : "စားသောက်ဆိုင်",
          listingType: "Rent",
          category: "Restaurant",
        },
      ],
    },
    {
      key: "presale",
      label: lang === "en" ? "New Projects" : "ကြိုပွိုင့်",
      icon: "🏗️",
      children: [
        {
          label:
            lang === "en" ? "All New Projects" : "ကြိုပွိုင့် စီမံကိန်းများ",
          listingType: "Pre-sale",
          category: "",
        },
        {
          label: lang === "en" ? "Condo Projects" : "ကွန်ဒို ကြိုပွိုင့်များ",
          listingType: "Pre-sale",
          category: "Condo",
        },
      ],
    },
    {
      key: "wanted",
      label: lang === "en" ? "Wanted" : "အိမ်ရှာဖွေသူများ",
      icon: "🔎",
      children: [
        {
          label:
            lang === "en"
              ? "All Wanted Listings"
              : "အိမ်ရှာဖွေနေသူများ (အားလုံး)",
          onSelect: () => handleWantedNavigate(),
        },
        {
          label:
            lang === "en"
              ? "Buyers (Want to Buy)"
              : "အိမ် ဝယ်ရန် ရှာဖွေနေသူများ",
          onSelect: () => handleWantedNavigate({ type: "Buy" }),
        },
        {
          label:
            lang === "en"
              ? "Tenants (Want to Rent)"
              : "အိမ် ငှားရန် ရှာဖွေနေသူများ",
          onSelect: () => handleWantedNavigate({ type: "Rent" }),
        },
        {
          label:
            lang === "en" ? "Post Wanted Listing" : "Wanted Listing တင်ရန်",
          onSelect: () => handleWantedNavigate({ openPost: true }),
        },
      ],
    },
    {
      key: "agents",
      label: lang === "en" ? "Agents" : "အကျိုးဆောင်များ",
      icon: "🤝",
      onClick: () => {
        setOpenMenu(null);
        navigate("/agents");
      },
      children: null,
    },
  ];

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm border-b border-slate-200 transition-all">
        {/* Top Brand & Auth Bar */}
        <div className="py-2.5 sm:py-3.5 px-3.5 sm:px-6 md:px-8 flex justify-between items-center border-b border-slate-100 gap-2 sm:gap-3">
          <Link
            to="/"
            onClick={() => {
              setOpenMenu(null);
              if (typeof onSelectCategory === "function") {
                onSelectCategory({ listingType: "", category: "" });
              }
            }}
            className="text-sm sm:text-lg md:text-xl font-extrabold text-emerald-600 flex items-center gap-1.5 sm:gap-2 hover:text-emerald-700 transition whitespace-nowrap shrink-0"
          >
            <span>🏠</span>
            <span>WIN WIN AUNG</span>
            <span className="text-xs md:text-sm font-semibold text-slate-600 hidden lg:inline">
              {t.tagline}
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0">
            {/* 🌐 Myanmar / English Switch */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] sm:text-[11px] font-bold shrink-0">
              <button
                type="button"
                onClick={() => handleToggleLang("mm")}
                className={`px-1.5 sm:px-2 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                  lang === "mm"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                မြန်မာ
              </button>
              <button
                type="button"
                onClick={() => handleToggleLang("en")}
                className={`px-1.5 sm:px-2 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                  lang === "en"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                EN
              </button>
            </div>

            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={handlePostClick}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs md:text-sm font-semibold bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition active:scale-95 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>+</span> {t.postBtn}
                </button>

                <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-sm shadow-inner">
                    {currentUserName
                      ? currentUserName.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-medium text-slate-500">
                      {t.greeting}
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
                  type="button"
                  onClick={onLogout}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs md:text-sm font-medium bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 text-[11px] sm:text-xs md:text-sm font-semibold bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span className="sm:hidden">{t.authBtnMobile}</span>
                <span className="hidden sm:inline">{t.authBtnDesktop}</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Navigation & Dropdown Bar */}
        <nav
          ref={navRef}
          className="px-3.5 sm:px-6 md:px-8 py-2 bg-slate-50/90 flex items-center flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible gap-1 md:gap-2 relative z-40 no-scrollbar"
        >
          {navItems.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const isOpen = openMenu === item.key;

            return (
              <div
                key={item.key}
                className="relative shrink-0"
                onMouseEnter={() => {
                  if (hasChildren) setOpenMenu(item.key);
                }}
                onMouseLeave={() => {
                  if (hasChildren) setOpenMenu(null);
                }}
              >
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenu((prev) =>
                        prev === item.key ? null : item.key,
                      )
                    }
                    className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                      isOpen
                        ? "bg-emerald-100 text-emerald-800"
                        : "text-slate-700 hover:bg-white hover:text-emerald-600"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    <span className="text-[10px] opacity-70">▾</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold text-slate-700 hover:bg-white hover:text-emerald-600 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                )}

                {hasChildren && isOpen && (
                  <div className="fixed sm:absolute left-3 right-3 sm:left-0 sm:right-auto top-auto sm:top-full mt-1 sm:mt-0 pt-0 sm:pt-1 sm:w-64 z-50">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 py-1.5">
                      {item.children.map((sub) => (
                        <button
                          key={sub.label}
                          type="button"
                          onClick={() =>
                            typeof sub.onSelect === "function"
                              ? sub.onSelect()
                              : handleFilterNavigate(sub)
                          }
                          className="w-full text-left px-4 py-2.5 text-xs md:text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium transition cursor-pointer"
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </header>

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
