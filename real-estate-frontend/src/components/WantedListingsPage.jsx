import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const STORAGE_KEY = "wwa_wanted_listings_v1";

const INITIAL_FORM = {
  request_type: "Rent",
  property_type: "Apartment",
  township: "",
  budget: "",
  contact_name: "",
  contact_phone: "",
  notes: "",
};

const WantedListingsPage = ({
  language,
  isAuthenticated = false,
  onOpenAuth,
}) => {
  const navigate = useNavigate();
  const lang = language || localStorage.getItem("app_lang") || "mm";
  const defaultCity = lang === "en" ? "Yangon" : "ရန်ကုန်";

  const [wantedList, setWantedList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState(""); // "" | "Buy" | "Rent"
  const [filterCategory, setFilterCategory] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postStep, setPostStep] = useState("choose"); // "choose" | "form"
  const [submitting, setSubmitting] = useState(false);

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info", // "info" | "warning" | "success"
    showAuthAction: false,
  });

  const [formData, setFormData] = useState({
    ...INITIAL_FORM,
    city: defaultCity,
  });

  const t = {
    backHome: lang === "en" ? "← Back to Home" : "← ပင်မစာမျက်နှာသို့",
    title:
      lang === "en"
        ? "Wanted Listings (Buyers & Tenants)"
        : "အိမ်ရှာဖွေသူများ စာရင်း (Wanted)",
    subtitle:
      lang === "en"
        ? "See what buyers and tenants are looking for or post your own property requirement."
        : "ဝယ်လိုသူနှင့် ငှားလိုသူများ၏ လိုအပ်ချက်များကို ကြည့်ရှုနိုင်ပြီး မိမိရှာဖွေလိုသော အိမ်ခြံမြေကိုလည်း တင်နိုင်ပါသည်။",
    buyPostBtn: lang === "en" ? "+ Want to Buy" : "+ ဝယ်ချင်ပါသည်",
    rentPostBtn: lang === "en" ? "+ Want to Rent" : "+ ငှားချင်ပါသည်",
    allTypes: lang === "en" ? "All (Buy / Rent)" : "အားလုံး (ဝယ်ရန် / ငှားရန်)",
    buyLabel: lang === "en" ? "Want to Buy" : "ဝယ်လိုသည်",
    rentLabel: lang === "en" ? "Want to Rent" : "ငှားလိုသည်",
    allCategories: lang === "en" ? "All Categories" : "အမျိုးအစားအားလုံး",
    resetBtn: lang === "en" ? "Reset" : "ရှင်းရန်",
    searchPlaceholder:
      lang === "en"
        ? "Search township, budget, or notes..."
        : "မြို့နယ်၊ ဈေးနှုန်း သို့မဟုတ် အချက်အလက် ရှာရန်...",
    budgetLabel: lang === "en" ? "Budget" : "ခန့်မှန်း ဈေးနှုန်း",
    townshipLabel: lang === "en" ? "Township" : "မြို့နယ်",
    contactLabel: lang === "en" ? "Contact" : "ဆက်သွယ်ရန်",
    noItems:
      lang === "en"
        ? "No wanted requests match your filter."
        : "ရှာဖွေမှုနှင့် ကိုက်ညီသော အိမ်ရှာလိုသူ စာရင်း မရှိပါ။",
    modalTitle:
      lang === "en"
        ? "Post Property Requirement"
        : "အိမ်ခြံမြေ ရှာဖွေလိုကြောင်း တင်ရန်",
    cancel: lang === "en" ? "Cancel" : "ပယ်ဖျက်ရန်",
    submit: lang === "en" ? "Submit Request" : "တင်သွင်းမည်",
    authRequiredTitle:
      lang === "en" ? "Account Required" : "အကောင့်ဝင်ရန် လိုအပ်ပါသည်",
    authRequiredMsg:
      lang === "en"
        ? "Please Login or Sign Up first to post a Wanted Listing."
        : "Wanted Listing တင်ရန် အကောင့်ဝင်ပါ သို့မဟုတ် အကောင့်အသစ် ပြုလုပ်ပါ။",
    loginNow:
      lang === "en" ? "Login / Sign Up" : "အကောင့်ဝင်ရန် / အသစ်ဖွင့်ရန်",
    closeBtn: lang === "en" ? "Close" : "ပိတ်မည်",
  };

  const hasToken =
    Boolean(isAuthenticated) || Boolean(localStorage.getItem("token"));

  const persistLocal = (nextList) => {
    setWantedList(nextList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    } catch {
      // ignore storage quota errors
    }
  };

  const openModalWithChoice = (type = "") => {
    if (!hasToken) {
      setAlertModal({
        isOpen: true,
        title: t.authRequiredTitle,
        message: t.authRequiredMsg,
        type: "warning",
        showAuthAction: typeof onOpenAuth === "function",
      });
      return;
    }

    if (type === "Buy" || type === "Rent") {
      setFormData((prev) => ({ ...prev, request_type: type }));
      setPostStep("form");
    } else {
      setPostStep("choose");
    }
    setIsPostModalOpen(true);
  };

  const getCategoryLabel = (cat) => {
    const map = {
      Apartment: lang === "en" ? "Apartment" : "တိုက်ခန်း",
      Condo: lang === "en" ? "Condo" : "ကွန်ဒို",
      House: lang === "en" ? "House" : "လုံးချင်းအိမ်",
      Land: lang === "en" ? "Land" : "မြေကွက်",
      Commercial: lang === "en" ? "Commercial" : "ဆိုင်ခန်း / ရုံးခန်း",
    };
    return map[cat] || cat;
  };

  useEffect(() => {
    let active = true;

    const loadWanted = async () => {
      try {
        const res = await API.get("/wanted");
        const apiData = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];
        if (active) {
          persistLocal(apiData);
        }
        return;
      } catch {
        // Backend /wanted မရနိုင်သေးပါက cached localStorage ကို ခေတ္တပြမည်
      }

      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (active) {
          setWantedList(Array.isArray(saved) ? saved : []);
        }
      } catch {
        if (active) setWantedList([]);
      }
    };

    loadWanted();
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set([
      "Apartment",
      "Condo",
      "House",
      "Land",
      "Commercial",
      ...wantedList.map((w) => w.property_type).filter(Boolean),
    ]);
    return Array.from(set);
  }, [wantedList]);

  const hasFilter = Boolean(searchTerm.trim() || filterType || filterCategory);

  const filteredWanted = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return wantedList.filter((item) => {
      if (filterType && item.request_type !== filterType) return false;
      if (filterCategory && item.property_type !== filterCategory) return false;
      if (q) {
        const hay = [
          item.township,
          item.city,
          item.budget,
          item.notes,
          item.contact_name,
          item.property_type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [wantedList, searchTerm, filterType, filterCategory]);

  const handleCreateWanted = async (e) => {
    e.preventDefault();
    if (!formData.township.trim()) return;

    setSubmitting(true);
    const payload = {
      request_type: formData.request_type,
      property_type: formData.property_type,
      township: formData.township.trim(),
      city: (formData.city || "").trim() || defaultCity,
      budget:
        formData.budget.trim() || (lang === "en" ? "Negotiable" : "ညှိနှိုင်း"),
      contact_name:
        formData.contact_name.trim() ||
        (lang === "en" ? "Buyer / Tenant" : "ရှာဖွေသူ"),
      contact_phone: formData.contact_phone.trim(),
      notes: formData.notes.trim(),
    };

    try {
      const res = await API.post("/wanted", payload);
      const created = res.data?.data ||
        res.data || {
          ...payload,
          id: Date.now(),
          created_at: new Date().toISOString(),
        };
      persistLocal([created, ...wantedList]);
      setIsPostModalOpen(false);
      setPostStep("choose");
      setFormData({
        ...INITIAL_FORM,
        city: defaultCity,
      });
      setAlertModal({
        isOpen: true,
        title: lang === "en" ? "Submitted" : "တင်သွင်းပြီးပါပြီ",
        message:
          lang === "en"
            ? "Your property requirement has been saved to the database."
            : "အိမ်ခြံမြေ ရှာဖွေလိုကြောင်း အချက်အလက်ကို Database ထဲ သိမ်းဆည်းပြီးပါပြီ။",
        type: "success",
        showAuthAction: false,
      });
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (lang === "en"
          ? "Failed to save to database. Please check login or server."
          : "Database ထဲ သိမ်းဆည်း၍ မရပါ။ အကောင့်ဝင်ထားမထား သို့မဟုတ် Server ကို စစ်ဆေးပါ။");
      setAlertModal({
        isOpen: true,
        title: lang === "en" ? "Error" : "အမှားအယွင်း ရှိနေပါသည်",
        message: errMsg,
        type: "warning",
        showAuthAction: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const alertTheme =
    alertModal.type === "success"
      ? {
          iconBg: "bg-emerald-100 text-emerald-700",
          icon: "✓",
        }
      : {
          iconBg: "bg-amber-100 text-amber-700",
          icon: "🔐",
        };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 mb-1 inline-block cursor-pointer"
          >
            {t.backHome}
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            🔎 {t.title}
          </h1>
          <p className="text-xs md:text-sm text-slate-500">{t.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={() => openModalWithChoice("Buy")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
          >
            {t.buyPostBtn}
          </button>
          <button
            type="button"
            onClick={() => openModalWithChoice("Rent")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
          >
            {t.rentPostBtn}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">{t.allTypes}</option>
          <option value="Buy">{t.buyLabel}</option>
          <option value="Rent">{t.rentLabel}</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">{t.allCategories}</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {getCategoryLabel(cat)}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={!hasFilter}
          onClick={() => {
            setSearchTerm("");
            setFilterType("");
            setFilterCategory("");
          }}
          className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            hasFilter
              ? "bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {t.resetBtn}
        </button>
      </div>

      {/* Wanted Cards */}
      {filteredWanted.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center text-sm text-slate-500">
          {t.noItems}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredWanted.map((item, idx) => {
            const isBuy = item.request_type === "Buy";
            const dateStr = item.created_at
              ? String(item.created_at).slice(0, 10)
              : "";
            return (
              <div
                key={item.id || item._id || idx}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        isBuy
                          ? "bg-emerald-600 text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {isBuy ? t.buyLabel : t.rentLabel}
                    </span>
                    <span className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1 rounded-full">
                      {getCategoryLabel(item.property_type)}
                    </span>
                  </div>
                  {dateStr && (
                    <span className="text-[11px] text-slate-400">
                      {dateStr}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-xs">
                      📍 {t.townshipLabel}
                    </span>
                    <span className="font-bold text-slate-800">
                      {item.township}
                      {item.city ? ` (${item.city})` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">
                      💰 {t.budgetLabel}
                    </span>
                    <span className="font-extrabold text-emerald-700">
                      {item.budget}
                    </span>
                  </div>
                </div>

                {item.notes && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {item.notes}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700">
                    👤 {item.contact_name}
                  </span>
                  {item.contact_phone && (
                    <a
                      href={`tel:${item.contact_phone}`}
                      className="font-mono font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg transition"
                    >
                      📞 {item.contact_phone}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pro Modern Custom Message Modal */}
      {alertModal.isOpen && (
        <div
          onClick={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden"
          >
            <div className="p-6 text-center space-y-3">
              <div
                className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center text-xl font-extrabold shadow-2xs ${alertTheme.iconBg}`}
              >
                {alertTheme.icon}
              </div>

              <h3 className="text-lg font-extrabold text-slate-900">
                {alertModal.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {alertModal.message}
              </p>
            </div>

            <div className="px-6 py-3.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setAlertModal((prev) => ({ ...prev, isOpen: false }))
                }
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                {t.closeBtn}
              </button>

              {alertModal.showAuthAction && (
                <button
                  type="button"
                  onClick={() => {
                    setAlertModal((prev) => ({ ...prev, isOpen: false }));
                    if (typeof onOpenAuth === "function") onOpenAuth();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  {t.loginNow} →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Post Wanted Modal */}
      {isPostModalOpen && (
        <div
          onClick={() => {
            setIsPostModalOpen(false);
            setPostStep("choose");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-base font-bold">
                  📝
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {t.modalTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPostModalOpen(false);
                  setPostStep("choose");
                }}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 flex items-center justify-center font-bold transition cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {postStep === "choose" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, request_type: "Buy" }));
                      setPostStep("form");
                    }}
                    className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-500 text-center space-y-2 transition cursor-pointer shadow-2xs"
                  >
                    <div className="w-11 h-11 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl">
                      🏷️
                    </div>
                    <div className="font-extrabold text-base text-emerald-800">
                      {t.buyLabel}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {lang === "en"
                        ? "Post a request for property to buy"
                        : "ဝယ်ယူလိုသော အိမ်ခြံမြေ လိုအပ်ချက် တင်ရန်"}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        request_type: "Rent",
                      }));
                      setPostStep("form");
                    }}
                    className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-500 text-center space-y-2 transition cursor-pointer shadow-2xs"
                  >
                    <div className="w-11 h-11 mx-auto rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl">
                      🔑
                    </div>
                    <div className="font-extrabold text-base text-blue-800">
                      {t.rentLabel}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {lang === "en"
                        ? "Post a request for property to rent"
                        : "ငှားရမ်းလိုသော အိမ်ခြံမြေ လိုအပ်ချက် တင်ရန်"}
                    </p>
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleCreateWanted}
                  className="space-y-4 text-sm"
                >
                  {/* Selected Type Banner */}
                  <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/80 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">
                        {lang === "en" ? "Selected:" : "ရွေးချယ်ထားသည်:"}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold ${
                          formData.request_type === "Buy"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {formData.request_type === "Buy"
                          ? t.buyLabel
                          : t.rentLabel}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPostStep("choose")}
                      className="text-emerald-700 hover:text-emerald-800 hover:underline font-bold cursor-pointer"
                    >
                      {lang === "en" ? "Change" : "ပြန်ရွေးရန်"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {lang === "en" ? "Request Type" : "ရှာဖွေလိုသည့်ပုံစံ"}
                      </label>
                      <select
                        value={formData.request_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            request_type: e.target.value,
                          })
                        }
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/80 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      >
                        <option value="Rent">{t.rentLabel}</option>
                        <option value="Buy">{t.buyLabel}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {lang === "en"
                          ? "Property Type"
                          : "အိမ်ခြံမြေ အမျိုးအစား"}
                      </label>
                      <select
                        value={formData.property_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            property_type: e.target.value,
                          })
                        }
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/80 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {getCategoryLabel(cat)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t.townshipLabel}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.township}
                        onChange={(e) =>
                          setFormData({ ...formData, township: e.target.value })
                        }
                        placeholder={
                          lang === "en" ? "e.g. Kamayut" : "ဥပမာ - ကမာရွတ်"
                        }
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/80 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t.budgetLabel}
                      </label>
                      <input
                        type="text"
                        value={formData.budget}
                        onChange={(e) =>
                          setFormData({ ...formData, budget: e.target.value })
                        }
                        placeholder={
                          lang === "en"
                            ? "e.g. 6 - 10 Lakhs/mo"
                            : "ဥပမာ - ၆ သိန်း - ၁၀ သိန်း"
                        }
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/80 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {lang === "en" ? "Your Name" : "အမည်"}
                      </label>
                      <input
                        type="text"
                        value={formData.contact_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact_name: e.target.value,
                          })
                        }
                        placeholder={
                          lang === "en" ? "Enter your name" : "အမည်ထည့်ရန်"
                        }
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/80 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {lang === "en" ? "Phone Number" : "ဖုန်းနံပါတ်"}
                      </label>
                      <input
                        type="text"
                        value={formData.contact_phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact_phone: e.target.value,
                          })
                        }
                        placeholder="09-..."
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/80 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {lang === "en"
                        ? "Details / Requirements"
                        : "အသေးစိတ် လိုအပ်ချက်"}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder={
                        lang === "en"
                          ? "Floor level, parking, compound details..."
                          : "လိုချင်သော အထပ်၊ ပါကင်၊ နေရာအခြေအနေ..."
                      }
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/80 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPostModalOpen(false);
                        setPostStep("choose");
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                    >
                      {submitting
                        ? lang === "en"
                          ? "Submitting..."
                          : "တင်သွင်းနေသည်..."
                        : t.submit}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default WantedListingsPage;
