import { useState, useEffect } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import CustomModal from "./CustomModal";

const PropertyDetailModal = ({
  isOpen,
  onClose,
  property,
  onPropertyUpdated,
  language,
}) => {
  const navigate = useNavigate();
  const lang = language || localStorage.getItem("app_lang") || "mm";

  const [rating, setRating] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const [unlockedPhone, setUnlockedPhone] = useState(null);
  const [unlockedAddress, setUnlockedAddress] = useState(null);
  const [unlocking, setUnlocking] = useState(false);

  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  useEffect(() => {
    setUnlockedPhone(null);
    setUnlockedAddress(null);
    setCurrentImageIndex(0);
    setCopied(false);
    setRating(0);
  }, [property?.id]);

  useEffect(() => {
    if (!isOpen || !property?.id) return;

    let isMounted = true;
    const incrementView = async () => {
      try {
        await API.put(`/properties/${property.id}/view`);
        if (isMounted && typeof onPropertyUpdated === "function") {
          onPropertyUpdated();
        }
      } catch (err) {
        console.error("Failed to increment view count:", err);
      }
    };

    incrementView();
    return () => {
      isMounted = false;
    };
  }, [isOpen, property?.id]);

  useEffect(() => {
    if (
      !isOpen ||
      !property ||
      !property.images ||
      property.images.length <= 1 ||
      isFullscreenOpen
    ) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, property, isFullscreenOpen]);

  if (!isOpen || !property) return null;

  const isRent =
    property.listing_type === "Rent" || property.status === "For Rent";

  const propType = property.property_type || property.type || "Apartment";
  const isApartment = propType === "Apartment";

  const cityText = property.city || (lang === "en" ? "Yangon" : "ရန်ကုန်");
  const townText = property.township || cityText;
  const fullLocationText =
    unlockedAddress || property.address || townText || cityText;

  const parsedArea =
    property.area_sqft !== undefined &&
    property.area_sqft !== null &&
    property.area_sqft !== "" &&
    !Number.isNaN(Number(property.area_sqft))
      ? Number(property.area_sqft)
      : null;

  const areaText = parsedArea !== null ? `${parsedArea} sq.ft` : "";
  const priceUnitText =
    lang === "en"
      ? isRent
        ? "Lakhs / mo"
        : "Lakhs"
      : isRent
        ? "သိန်း / လ"
        : "သိန်း";

  const formattedDate = property.created_at
    ? new Date(property.created_at).toLocaleDateString(
        lang === "en" ? "en-GB" : "my-MM",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        },
      )
    : "";

  const cleanDescription = (property.description || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  const buildBrokerPostText = () => {
    const lines = [
      `📍 နေရာ – ${fullLocationText}${
        property.township && !fullLocationText.includes(property.township)
          ? `၊ ${property.township}`
          : ""
      }`,
      `🏷️ အမျိုးအစား – ${propType} (${isRent ? "အငှား" : "အရောင်း"})`,
    ];

    if (areaText) {
      lines.push(`📐 အကျယ် – ${areaText}`);
    }

    if (property.ownership_document) {
      lines.push(`📄 စာရွက်စာတမ်း – ${property.ownership_document}`);
    }

    if (property.building_status && isApartment) {
      lines.push(`🏢 အခြေအနေ – ${property.building_status}`);
    }

    if (cleanDescription) {
      lines.push("", `🏡 အသေးစိတ်အချက်အလက်`, cleanDescription);
    }

    lines.push("", `💰 ဈေးနှုန်း – ${property.price} ${priceUnitText}`);

    if (unlockedPhone) {
      lines.push(`📞 ဆက်သွယ်ရန် – ${unlockedPhone}`);
    }

    return lines.join("\n");
  };

  const handleCopyPost = async () => {
    const textToCopy = buildBrokerPostText();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? property.images.length - 1 : prev - 1,
      );
    }
  };

  const handleOpenFullscreen = (index) => {
    setFullscreenIndex(index);
    setIsFullscreenOpen(true);
  };

  const nextFullscreenImage = (e) => {
    e.stopPropagation();
    if (property.images && property.images.length > 0) {
      setFullscreenIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevFullscreenImage = (e) => {
    e.stopPropagation();
    if (property.images && property.images.length > 0) {
      setFullscreenIndex((prev) =>
        prev === 0 ? property.images.length - 1 : prev - 1,
      );
    }
  };

  const handleUnlockContact = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setModalConfig({
        isOpen: true,
        title: lang === "en" ? "Login Required" : "အကောင့်ဝင်ရန် လိုအပ်ပါသည်",
        message:
          lang === "en"
            ? "Please log in or sign up to view contact phone and full address."
            : "ကျေးဇူးပြု၍ ဖုန်းနံပါတ်နှင့် လိပ်စာ ကြည့်ရှုရန် အကောင့်ဝင်ပါ (သို့မဟုတ်) အကောင့်အသစ်ဖွင့်ပါ။",
        type: "info",
      });
      return;
    }

    try {
      setUnlocking(true);
      const response = await API.post(`/properties/${property.id}/unlock`);
      if (response.data.success) {
        setUnlockedPhone(response.data.contact_phone || property.contact_phone);
        setUnlockedAddress(
          response.data.address || property.address || property.township,
        );
        if (typeof onPropertyUpdated === "function") {
          onPropertyUpdated();
        }
      }
    } catch (err) {
      console.error("Unlock error:", err);
      setModalConfig({
        isOpen: true,
        title: lang === "en" ? "Action Failed" : "လုပ်ဆောင်ချက် မအောင်မြင်ပါ",
        message:
          err.response?.data?.error ||
          (lang === "en"
            ? "Insufficient coins or an error occurred."
            : "Coins မလုံလောက်ပါ သို့မဟုတ် အမှားအယွင်းရှိနေပါသည်။"),
        type: "error",
      });
    } finally {
      setUnlocking(false);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || rating === "0") {
      setModalConfig({
        isOpen: true,
        title: lang === "en" ? "Selection Required" : "အချက်အလက် လိုအပ်နေပါသည်",
        message:
          lang === "en"
            ? "Please select a star rating."
            : "ကျေးဇူးပြု၍ ကြယ်ပွင့် (Rating) ရွေးချယ်ပါ။",
        type: "warning",
      });
      return;
    }

    try {
      await API.post(`/properties/${property.id}/rating`, {
        rating: parseFloat(rating),
      });
      setModalConfig({
        isOpen: true,
        title: lang === "en" ? "Success" : "အောင်မြင်ပါသည်။",
        message:
          lang === "en"
            ? "Your rating has been submitted."
            : "Rating ပေးခြင်း အောင်မြင်ပါသည်။",
        type: "success",
      });
      if (typeof onPropertyUpdated === "function") {
        onPropertyUpdated();
      }
      onClose();
    } catch (err) {
      console.error("Failed to submit rating", err);
      setModalConfig({
        isOpen: true,
        title: lang === "en" ? "Error" : "အမှားအယွင်း ရှိနေပါသည်",
        message:
          err.response?.data?.error ||
          (lang === "en" ? "Unable to submit rating." : "Rating ပေး၍ မရပါ။"),
        type: "error",
      });
    }
  };

  const getImageUrl = (imgObj) => {
    const imgPath = imgObj?.url || imgObj;
    if (!imgPath) return "";
    if (imgPath.startsWith("http")) return imgPath;
    const backendUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace("/api", "")
      : "http://localhost:5002";
    return `${backendUrl}${imgPath}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto border border-slate-100">
          {/* Slider Header */}
          <div className="relative h-72 bg-slate-900 group cursor-pointer overflow-hidden">
            {property.images && property.images.length > 0 ? (
              <>
                <img
                  src={getImageUrl(property.images[currentImageIndex])}
                  alt={property.title}
                  onClick={() => handleOpenFullscreen(currentImageIndex)}
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                  title={
                    lang === "en"
                      ? "Click to view fullscreen"
                      : "ပုံကို နှိပ်၍ အကြီးကြည့်ရန်"
                  }
                />

                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/80 w-10 h-10 rounded-full flex items-center justify-center font-bold transition shadow-lg backdrop-blur-sm"
                    >
                      ❮
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/80 w-10 h-10 rounded-full flex items-center justify-center font-bold transition shadow-lg backdrop-blur-sm"
                    >
                      ❯
                    </button>

                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-medium pointer-events-none">
                      📸 {currentImageIndex + 1} / {property.images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium bg-slate-100">
                🏠 {lang === "en" ? "No Image Available" : "ဓာတ်ပုံ မရှိသေးပါ"}
              </div>
            )}

            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span
                className={`text-xs px-3.5 py-1.5 rounded-full font-bold shadow-lg tracking-wider ${
                  isRent
                    ? "bg-blue-600 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {isRent
                  ? lang === "en"
                    ? "🏠 For Rent"
                    : "🏠 အငှား (For Rent)"
                  : lang === "en"
                    ? "🏷️ For Sale"
                    : "🏷️ အရောင်း (For Sale)"}
              </span>
              <span className="bg-slate-900/75 text-white text-xs px-3 py-1.5 rounded-full font-semibold backdrop-blur-sm">
                {propType}
              </span>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold transition shadow-lg backdrop-blur-sm z-10"
            >
              ✕
            </button>
          </div>

          {/* Thumbnail Strip */}
          {property.images && property.images.length > 1 && (
            <div className="px-6 pt-3 pb-1 bg-slate-50 border-b border-slate-200/70 flex items-center gap-2 overflow-x-auto">
              {property.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                    currentImageIndex === idx
                      ? "border-emerald-600 ring-2 ring-emerald-200"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`${property.title} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Property Details Content */}
          <div className="p-6 space-y-5">
            {/* Breadcrumb Path */}
            <div className="text-[11px] font-medium text-slate-500 flex flex-wrap items-center gap-1.5 bg-slate-100/80 px-3 py-1.5 rounded-lg">
              <span>{lang === "en" ? "Home" : "ပင်မ"}</span>
              <span>›</span>
              <span>
                {isRent
                  ? lang === "en"
                    ? "For Rent"
                    : "ငှားရန်"
                  : lang === "en"
                    ? "For Sale"
                    : "ရောင်းရန်"}
              </span>
              <span>›</span>
              <span>{cityText}</span>
              {property.township && (
                <>
                  <span>›</span>
                  <span className="text-slate-700 font-semibold">
                    {property.township}
                  </span>
                </>
              )}
              <span>›</span>
              <span className="text-emerald-700 font-semibold">{propType}</span>
            </div>

            <div className="flex justify-between items-start gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {property.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  📍 {lang === "en" ? "Township" : "မြို့နယ်"}:{" "}
                  <span className="font-bold text-slate-700">{townText}</span> |{" "}
                  {lang === "en" ? "Listing ID" : "ပို့စ်အမှတ်"}: #{property.id}
                  {formattedDate && (
                    <>
                      {" "}
                      |{" "}
                      <span>
                        {lang === "en" ? "Posted" : "တင်ထားသည့်ရက်"}:{" "}
                        <strong className="text-slate-600">
                          {formattedDate}
                        </strong>
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyPost}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition cursor-pointer"
                >
                  {copied
                    ? lang === "en"
                      ? "✅ Copied!"
                      : "✅ Copied!"
                    : lang === "en"
                      ? "📋 Copy Post"
                      : "📋 Copy Post"}
                </button>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                    isRent
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {isRent ? "Rent" : "Sale"}
                </span>
              </div>
            </div>

            {/* Price & Stats Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">
                  💰 {lang === "en" ? "Price" : "ဈေးနှုန်း"}
                </p>
                <h3 className="text-emerald-600 font-extrabold text-2xl mt-0.5">
                  {property.price}{" "}
                  <span className="text-sm font-normal text-slate-600">
                    {priceUnitText}
                  </span>
                </h3>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs font-bold text-slate-700">
                  ⭐ {Number(property.average_rating || 0).toFixed(1)}{" "}
                  <span className="text-slate-400 font-normal">
                    ({property.total_ratings || 0})
                  </span>
                </p>
                <p className="text-xs font-extrabold text-slate-700">
                  👀 {property.views || 0} {lang === "en" ? "views" : "ဦးကြည့်"}
                </p>
              </div>
            </div>

            {/* Key Highlights */}
            <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-sm text-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {lang === "en" ? "Key Property Details" : "အဓိက အချက်အလက်များ"}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                  <span className="text-xs text-slate-400 block">
                    📍{" "}
                    {lang === "en" ? "Location / Township" : "နေရာ / မြို့နယ်"}
                  </span>
                  <span className="font-bold text-slate-800">
                    {unlockedAddress || property.address
                      ? `${unlockedAddress || property.address} (${townText})`
                      : townText}
                  </span>
                </div>

                {areaText && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                    <span className="text-xs text-slate-400 block">
                      📐 {lang === "en" ? "Area" : "အကျယ် (Area)"}
                    </span>
                    <span className="font-bold text-slate-800">{areaText}</span>
                  </div>
                )}

                <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                  <span className="text-xs text-slate-400 block">
                    🏷️ {lang === "en" ? "Category" : "အမျိုးအစား"}
                  </span>
                  <span className="font-bold text-slate-800">
                    {propType} —{" "}
                    {isRent
                      ? lang === "en"
                        ? "For Rent"
                        : "အငှား"
                      : lang === "en"
                        ? "For Sale"
                        : "အရောင်း"}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                  <span className="text-xs text-slate-400 block">
                    📄{" "}
                    {lang === "en"
                      ? "Ownership Document"
                      : "ပိုင်ဆိုင်မှု စာရွက်စာတမ်း"}
                  </span>
                  <span className="font-bold text-slate-800">
                    {property.ownership_document ||
                      (lang === "en" ? "Grant" : "ဂရန်")}
                  </span>
                </div>
              </div>

              {property.building_status && isApartment && (
                <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                  <span className="text-xs text-slate-400 block">
                    🏢{" "}
                    {lang === "en"
                      ? "Building Status (BCC)"
                      : "အဆောက်အအုံ အခြေအနေ (BCC / လူနေထိုင်ခွင့်)"}
                  </span>
                  <span className="font-bold text-slate-800">
                    {property.building_status}
                  </span>
                </div>
              )}
            </div>

            {/* Detailed Description */}
            <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/70 space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                🏡{" "}
                {lang === "en"
                  ? "Property Description"
                  : "အိမ်အချက်အလက် / အသေးစိတ် ဖော်ပြချက်"}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                {cleanDescription ||
                  (lang === "en"
                    ? "No description provided."
                    : "အသေးစိတ် ဖော်ပြချက် မရှိပါ။")}
              </p>
            </div>

            {/* Contact & Address Section */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-5 rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                  <span>📞</span>{" "}
                  {lang === "en"
                    ? "Agent / Owner Contact & Address"
                    : "အကျိုးဆောင် / ပိုင်ရှင် ဆက်သွယ်ရန် ဖုန်းနံပါတ်နှင့် လိပ်စာ"}
                </h3>
              </div>

              {unlockedPhone ? (
                <div className="bg-white p-4 rounded-xl border border-emerald-300 space-y-2 shadow-sm animate-fadeIn">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      {lang === "en"
                        ? "Contact Phone"
                        : "ဆက်သွယ်ရန် ဖုန်းနံပါတ်"}
                    </p>
                    <a
                      href={`tel:${unlockedPhone}`}
                      className="text-lg font-mono font-extrabold text-emerald-700 hover:underline"
                    >
                      📞 {unlockedPhone}
                    </a>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      {lang === "en"
                        ? "Full Address"
                        : "တိကျသည့် လိပ်စာ အပြည့်အစုံ"}
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      📍 {fullLocationText}
                    </p>
                  </div>
                  <div className="pt-2">
                    <a
                      href={`tel:${unlockedPhone}`}
                      className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-md"
                    >
                      {lang === "en" ? "Call Now" : "ဖုန်းခေါ်ဆိုရန်"}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 space-y-2">
                  <p className="text-xs text-slate-500">
                    {lang === "en"
                      ? "Click below to unlock the contact phone number and full address."
                      : "အကျိုးဆောင်၏ ဆက်သွယ်ရန် ဖုန်းနံပါတ်နှင့် တိကျသည့် လိပ်စာကို ကြည့်ရှုရန် အောက်ပါခလုတ်ကို နှိပ်ပါ။"}
                  </p>
                  <button
                    onClick={handleUnlockContact}
                    disabled={unlocking}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                  >
                    <span>🔑</span>{" "}
                    {unlocking
                      ? lang === "en"
                        ? "Unlocking..."
                        : "ဖွင့်လှစ်နေပါသည်..."
                      : lang === "en"
                        ? "Unlock Phone & Full Address"
                        : "ဖုန်းနံပါတ်နှင့် လိပ်စာ အပြည့်အစုံ ကြည့်မည်"}
                  </button>
                </div>
              )}
            </div>

            {/* Rating Section */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">
                ⭐{" "}
                {lang === "en"
                  ? "Rate This Listing"
                  : "ဤပို့စ်နှင့် ပတ်သက်၍ သုံးသပ်ချက် (Rating) ပေးရန်"}
              </h3>
              <form
                onSubmit={handleRatingSubmit}
                className="flex items-center gap-3"
              >
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="flex-1 border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="0">
                    {lang === "en" ? "Select rating" : "ကြယ်ပွင့် ရွေးချယ်ပါ"}
                  </option>
                  <option value="5">
                    ⭐⭐⭐⭐⭐ {lang === "en" ? "(Excellent)" : "(အကောင်းဆုံး)"}
                  </option>
                  <option value="4">
                    ⭐⭐⭐⭐ {lang === "en" ? "(Good)" : "(ကောင်း)"}
                  </option>
                  <option value="3">
                    ⭐⭐⭐ {lang === "en" ? "(Fair)" : "(သင့်တော်)"}
                  </option>
                  <option value="2">
                    ⭐⭐ {lang === "en" ? "(Poor)" : "(အားနည်း)"}
                  </option>
                  <option value="1">
                    ⭐ {lang === "en" ? "(Bad)" : "(မကောင်းပါ)"}
                  </option>
                </select>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-md"
                >
                  {lang === "en" ? "Submit Rating" : "Rating ပေးမည်"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isFullscreenOpen && property.images && property.images.length > 0 && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          onClick={() => setIsFullscreenOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[95vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(property.images[fullscreenIndex])}
              alt={property.title}
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />

            <button
              onClick={() => setIsFullscreenOpen(false)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/30 text-white w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg transition backdrop-blur-sm"
            >
              ✕
            </button>

            {property.images.length > 1 && (
              <>
                <button
                  onClick={prevFullscreenImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition shadow-lg"
                >
                  ❮
                </button>
                <button
                  onClick={nextFullscreenImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition shadow-lg"
                >
                  ❯
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full font-medium">
                  {fullscreenIndex + 1} / {property.images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <CustomModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => {
          setModalConfig({ ...modalConfig, isOpen: false });
          if (
            modalConfig.title === "အကောင့်ဝင်ရန် လိုအပ်ပါသည်" ||
            modalConfig.title === "Login Required"
          ) {
            onClose();
            navigate("/login");
          }
        }}
      />
    </>
  );
};

export default PropertyDetailModal;
