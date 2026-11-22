import React, { useState, useEffect, useRef } from "react";
import API from "../api/axios";
import { useSelector } from "react-redux";
import { createProperty } from "../api/propertyApi";
import CustomModal from "./CustomModal";
import { calculateAreaFromInput } from "../utils/propertyHelpers";

const INITIAL_BROKER_FORM = {
  facing: "မြောက်အလှည့်",
  utilities: "ရေမီးစုံ",
  buildingDesc: "နှစ်ထပ်ခွဲ RC တိုက်သစ်",
  masterRooms: "၃ ခန်း",
  singleRooms: "",
  extraFeatures:
    "ရေပူ/ရေအေး ရ\nအခန်းအားလုံး ပြင်ဆင်ပြီး\nခြံထဲ ကားထားလို့ရ\nAccount to Account ရ",
  note: "ညှိနှိုင်း",
};

const OWNERSHIP_DOCUMENT_OPTIONS = [
  "ဂရန်မြေ (Grant Land) - လူနေထိုင်ခွင့်ပြီးသား",
  "ပါမစ်မြေ – အရှုပ်အရှင်းကင်း၊ စည်ပင်စစ်ပြီး",
  "ဘိုးဘွားပိုင်မြေ (Freehold)",
  "တိုက်ခန်း (Apartment)",
  "လုပ်အားပေးစာအုပ်",
  "ရွာမြေ",
  "ဥယျာဥ်ခြံမြေ",
  "လယ်မြေ (လန 30 ကျပြီး)",
  "အငှားစာချုပ် / ငှားရမ်းခွင့်ပြုချက် (Lease Agreement)",
  "စီးပွားရေးလုပ်ငန်းလိုင်စင် / စည်ပင်ခွင့်ပြုချက်",
  "စားသောက်ဆိုင်လိုင်စင် / ကျန်းမာရေးနှင့် မီးသတ်ထောက်ခံချက်",
  "အခြား (Other)",
];

const AddPropertyModal = ({ isOpen, onClose, onPropertyAdded }) => {
  const { user } = useSelector((state) => state.auth);
  const [userCoins, setUserCoins] = useState(0);

  const [isOwnershipOpen, setIsOwnershipOpen] = useState(false);
  const ownershipDropdownRef = useRef(null);

  useEffect(() => {
    if (!isOwnershipOpen) return;

    const handleOutsideClick = (e) => {
      if (
        ownershipDropdownRef.current &&
        !ownershipDropdownRef.current.contains(e.target)
      ) {
        setIsOwnershipOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOwnershipOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchLatestUserData = async () => {
      try {
        const response = await API.get("/auth/me");
        if (response.data.success && response.data.user) {
          const latestCoins = response.data.user.coins ?? 0;
          setUserCoins(latestCoins);

          const localUser = JSON.parse(localStorage.getItem("user") || "{}");
          localUser.coins = latestCoins;
          localStorage.setItem("user", JSON.stringify(localUser));
        }
      } catch (err) {
        console.error("Failed to fetch latest user coins:", err);
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        setUserCoins(
          storedUser.coins !== undefined
            ? storedUser.coins
            : (user?.coins ?? 0),
        );
      }
    };

    fetchLatestUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const requiredCoins = 30;
  const hasEnoughCoins = userCoins >= requiredCoins;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    area_sqft: "",
    dimensions_label: "",
    type: "Apartment",
    listing_type: "Sale",
    township: "",
    address: "",
    lat: "",
    lng: "",
    contact_phone: "",
    ownership_document: "ဂရန်မြေ (Grant Land) - လူနေထိုင်ခွင့်ပြီးသား",
    building_status: "BCC ကျပြီး / လူနေထိုင်ခွင့် ကျပြီး",
  });

  // 📝 Broker Form Helper States
  const [isBrokerBuilderOpen, setIsBrokerBuilderOpen] = useState(false);
  const [brokerForm, setBrokerForm] = useState(INITIAL_BROKER_FORM);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 📐 Tab ထွက်သွားချိန် (onBlur) တွင် Auto Square တွက်ပေးမည့် Function
  const handleAreaBlur = () => {
    const rawValue = formData.dimensions_label || formData.area_sqft;
    if (!rawValue) return;

    const { areaSqft, dimensionsLabel } = calculateAreaFromInput(rawValue);

    setFormData((prev) => ({
      ...prev,
      area_sqft: areaSqft || prev.area_sqft,
      dimensions_label: dimensionsLabel || prev.dimensions_label,
    }));
  };

  const handleBrokerFieldChange = (e) => {
    const { name, value } = e.target;
    setBrokerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyBrokerForm = () => {
    const detailBullets = [];

    if (brokerForm.buildingDesc.trim()) {
      detailBullets.push(`• ${brokerForm.buildingDesc.trim()}`);
    }
    if (brokerForm.masterRooms.trim()) {
      detailBullets.push(`• Master Bedroom – ${brokerForm.masterRooms.trim()}`);
    }
    if (brokerForm.singleRooms.trim()) {
      detailBullets.push(`• Single Bedroom – ${brokerForm.singleRooms.trim()}`);
    }
    if (brokerForm.extraFeatures.trim()) {
      brokerForm.extraFeatures
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => {
          detailBullets.push(line.startsWith("•") ? line : `• ${line}`);
        });
    }

    const parts = [];
    if (formData.dimensions_label.trim()) {
      parts.push(`📐 အကျယ် – ${formData.dimensions_label.trim()}`);
    }
    if (brokerForm.facing.trim()) {
      parts.push(`🧭 ${brokerForm.facing.trim()}`);
    }
    if (brokerForm.utilities.trim()) {
      parts.push(`💧⚡ ${brokerForm.utilities.trim()}`);
    }
    if (detailBullets.length > 0) {
      parts.push(`\n🏡 အိမ်အချက်အလက်\n${detailBullets.join("\n")}`);
    }
    if (brokerForm.note.trim()) {
      parts.push(`\n💬 မှတ်ချက် – ${brokerForm.note.trim()}`);
    }

    const builtText = parts.join("\n");

    setFormData((prev) => ({
      ...prev,
      description: prev.description
        ? `${prev.description.trim()}\n\n${builtText}`
        : builtText,
    }));
    setIsBrokerBuilderOpen(false);
  };

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
          }));
          setModalConfig({
            isOpen: true,
            title: "အောင်မြင်ပါသည်",
            message: "လက်ရှိတည်နေရာ (GPS) ကို အောင်မြင်စွာ ရယူပြီးပါပြီ။",
            type: "success",
          });
        },
        (error) => {
          console.error(error);
          setModalConfig({
            isOpen: true,
            title: "အမှားအယွင်း ရှိနေပါသည်",
            message:
              "တည်နေရာ ရယူ၍ မရပါ။ ကျေးဇူးပြု၍ Location Permission ခွင့်ပြုပေးပါ။",
            type: "error",
          });
        },
      );
    } else {
      setModalConfig({
        isOpen: true,
        title: "မထောက်ပံ့ပါ",
        message: "Browser တွင် Geolocation ကို မထောက်ပံ့ပါ။",
        type: "error",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasEnoughCoins) {
      setError(
        "သင့်တွင် ကြော်ငြာတင်ရန် Coins မလုံလောက်ပါ။ (အနည်းဆုံး 30 Coins လိုအပ်ပါသည်။)",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalDescription = formData.description.trim();
      const dimText = formData.dimensions_label.trim();
      if (dimText && !finalDescription.includes(dimText)) {
        const dimLine = `📐 အကျယ် – ${dimText}`;
        finalDescription = finalDescription
          ? `${dimLine}\n${finalDescription}`
          : dimLine;
      }

      const resolvedStatus =
        formData.listing_type === "Rent"
          ? "For Rent"
          : formData.listing_type === "Pre-sale"
            ? "Pre-sale"
            : "For Sale";

      const uploadData = new FormData();
      uploadData.append("title", formData.title);
      uploadData.append("description", finalDescription);
      uploadData.append("price", formData.price);

      const numericArea = parseFloat(String(formData.area_sqft).trim());
      if (!Number.isNaN(numericArea) && numericArea > 0) {
        uploadData.append("area_sqft", String(numericArea));
      }

      uploadData.append("property_type", formData.type);
      uploadData.append("listing_type", formData.listing_type);
      uploadData.append("status", resolvedStatus);

      uploadData.append("township", formData.township || "Bahan");
      uploadData.append("address", formData.address || formData.township || "");
      uploadData.append("city", "Yangon");
      uploadData.append("latitude", formData.lat);
      uploadData.append("longitude", formData.lng);
      uploadData.append("contact_phone", formData.contact_phone);
      uploadData.append("ownership_document", formData.ownership_document);
      uploadData.append(
        "building_status",
        ["Apartment", "Condo", "Commercial", "Restaurant"].includes(
          formData.type,
        )
          ? formData.building_status
          : "လူနေထိုင်ခွင့် အလိုလိုပြီးသား (ဂရန်/ပါမစ်)",
      );
      uploadData.append("owner_id", user?.id || user?._id || 1);

      for (let i = 0; i < files.length; i++) {
        uploadData.append("images", files[i]);
      }

      await createProperty(uploadData);
      if (typeof onPropertyAdded === "function") {
        onPropertyAdded();
      }
      if (typeof onClose === "function") {
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to post property");
    } finally {
      setLoading(false);
    }
  };

  const activeUserId =
    user?.id ||
    user?._id ||
    JSON.parse(localStorage.getItem("user") || "{}")?.id ||
    "2";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
          >
            ✕
          </button>

          <h2 className="text-2xl font-bold mb-2 text-slate-800">
            Post New Property
          </h2>

          <div className="bg-slate-900 text-slate-100 p-3 rounded-xl mb-4 flex items-center justify-between text-xs shadow-inner border border-slate-800">
            <div>
              <span className="text-slate-400">သင့်လက်ကျန် Coins: </span>
              <span className="text-emerald-400 font-bold text-sm">
                {userCoins} Coins
              </span>
            </div>
            <div>
              <span className="text-slate-400">ကျသင့်ငွေ: </span>
              <span className="text-amber-400 font-bold">
                -{requiredCoins} Coins / Post
              </span>
            </div>
          </div>

          {!hasEnoughCoins && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-xs mb-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between font-semibold text-amber-900">
                <span>
                  ⚠️ သင့်တွင် Coins မလုံလောက်ပါ။ (လိုအပ်သည်: 30 Coins)
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-1.5">
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  🪙 Coins အလိုအလျောက် ဖြည့်သွင်းရန် (Auto Top-up)
                </p>
                <p className="text-slate-700">
                  KBZPay / AYA Pay:{" "}
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    09784970257
                  </span>{" "}
                  (Tun Tun Naing)
                </p>
                <div className="bg-emerald-50 border border-emerald-200 p-2 rounded text-emerald-900 font-medium">
                  💡 ငွေလွှဲသည့်အခါ Note (သို့) Message တွင်{" "}
                  <span className="underline font-bold text-red-600">
                    user_{activeUserId}
                  </span>{" "}
                  ဟု မိမိ၏ ID ဖြင့် မဖြစ်မနေ ထည့်သွင်းပေးပါ။
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Property Title (ခေါင်းစဉ်)
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="ဥပမာ - နှစ်ထပ် RC တိုက်သစ် အရောင်း"
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
              <div className="flex flex-col justify-between">
                <label className="block text-sm font-medium text-gray-700 leading-snug">
                  Listing Type (ကြော်ငြာအမျိုးအစား)
                </label>
                <select
                  name="listing_type"
                  value={formData.listing_type}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500 font-semibold text-emerald-700 bg-emerald-50/50 cursor-pointer"
                >
                  <option value="Sale">🏷️ အရောင်း (For Sale)</option>
                  <option value="Rent">🏠 အငှား (For Rent)</option>
                  <option value="Pre-sale">🏗️ ကြိုပွိုင့် (Pre-sale)</option>
                </select>
              </div>

              <div className="flex flex-col justify-between">
                <label className="block text-sm font-medium text-gray-700 leading-snug">
                  Property Type (အိမ်ခြံမြေ အမျိုးအစား)
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 bg-white text-slate-800 cursor-pointer"
                >
                  <option value="Apartment">Apartment (တိုက်ခန်း)</option>
                  <option value="Condo">Condo (ကွန်ဒို)</option>
                  <option value="Land">Land Plot (မြေကွက်)</option>
                  <option value="Villa">Villa / House (လုံးချင်းအိမ်)</option>
                  <option value="Commercial">
                    Commercial / Shop / Office (ဆိုင်ခန်း / ရုံးခန်း)
                  </option>
                  <option value="Restaurant">Restaurant (စားသောက်ဆိုင်)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price (
                  {formData.listing_type === "Rent" ? "တစ်လ (သိန်း)" : "သိန်း"})
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  placeholder={
                    formData.listing_type === "Rent"
                      ? "ဥပမာ - 5"
                      : "ဥပမာ - 7800"
                  }
                  className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  📐 အကျယ် (ဥပမာ - 12 x 55 → Tab)
                </label>
                <input
                  type="text"
                  name="dimensions_label"
                  value={formData.dimensions_label}
                  onChange={handleChange}
                  onBlur={handleAreaBlur}
                  placeholder="12 x 55 သို့မဟုတ် 12.5 x 55"
                  className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                📏 စတုရန်းပေ (Auto Square / Sq.ft)
              </label>
              <input
                type="number"
                step="any"
                name="area_sqft"
                value={formData.area_sqft}
                onChange={handleChange}
                onBlur={handleAreaBlur}
                placeholder="Tab ထွက်ပါက အလိုအလျောက် တွက်ပေးမည်"
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 bg-slate-50 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Township / Location (မြို့နယ်)
                </label>
                <input
                  type="text"
                  name="township"
                  required
                  value={formData.township}
                  onChange={handleChange}
                  placeholder="ဥပမာ - အရှေ့ဒဂုံ"
                  className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  📍 လမ်း / ရပ်ကွက် လိပ်စာ
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="ဥပမာ - စံပယ်ဦး (၂) လမ်း၊ ၅၂ ရပ်ကွက်"
                  className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">
                  📍 တည်နေရာ မြေပုံ (GPS Coordinates)
                </span>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
                >
                  <span>📍</span> ကျွန်ုပ်ရှိရာနေရာ (Auto-Detect)
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    step="any"
                    name="lat"
                    required
                    value={formData.lat}
                    onChange={handleChange}
                    placeholder="Latitude (လတ္တီကျု)"
                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-sm"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="any"
                    name="lng"
                    required
                    value={formData.lng}
                    onChange={handleChange}
                    placeholder="Longitude (လောင်ဂျီကျု)"
                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Phone (ဆက်သွယ်ရန် ဖုန်း)
              </label>
              <input
                type="text"
                name="contact_phone"
                required
                value={formData.contact_phone}
                onChange={handleChange}
                placeholder="ဥပမာ - 09265388758"
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div ref={ownershipDropdownRef} className="relative">
              <label
                htmlFor="ownership_document_btn"
                className="block text-sm font-medium text-gray-700"
              >
                Ownership Document (ပိုင်ဆိုင်မှု စာရွက်စာတမ်း)
              </label>

              <button
                id="ownership_document_btn"
                type="button"
                onClick={() => setIsOwnershipOpen((prev) => !prev)}
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 bg-white text-slate-800 text-sm text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 flex items-center justify-between gap-2"
              >
                <span className="truncate">{formData.ownership_document}</span>
                <span className="text-slate-500 text-xs shrink-0">
                  {isOwnershipOpen ? "▲" : "▼"}
                </span>
              </button>

              {isOwnershipOpen && (
                <div className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg divide-y divide-slate-100">
                  {OWNERSHIP_DOCUMENT_OPTIONS.map((optionText) => {
                    const isSelected =
                      formData.ownership_document === optionText;
                    return (
                      <button
                        key={optionText}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            ownership_document: optionText,
                          }));
                          setIsOwnershipOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-sm transition cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-800 font-semibold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {optionText}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {["Apartment", "Condo", "Commercial", "Restaurant"].includes(
              formData.type,
            ) && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Building Status (BCC နှင့် လူနေထိုင်ခွင့် အခြေအနေ)
                </label>
                <select
                  name="building_status"
                  value={formData.building_status}
                  onChange={handleChange}
                  className="w-full max-w-full truncate border border-gray-300 rounded-lg p-2.5 mt-1 bg-white text-slate-800 cursor-pointer focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="BCC ကျပြီး / လူနေထိုင်ခွင့် ကျပြီး">
                    BCC ကျပြီး / လူနေထိုင်ခွင့် ကျပြီး
                  </option>
                  <option value="BCC မကျသေး / လူနေထိုင်ခွင့် ကျပြီး">
                    BCC မကျသေး / လူနေထိုင်ခွင့် ကျပြီး
                  </option>
                  <option value="BCC ကျပြီး / လူနေထိုင်ခွင့် ဆောင်ရွက်ဆဲ">
                    BCC ကျပြီး / လူနေထိုင်ခွင့် ဆောင်ရွက်ဆဲ
                  </option>
                  <option value="ဆောက်လုပ်ဆဲ (Under Construction)">
                    ဆောက်လုပ်ဆဲ (Under Construction)
                  </option>
                  <option value="အခြား (Other)">
                    အခြား (လူနေထိုင်ခွင့်ရှိပြီးသား)
                  </option>
                </select>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Description (အိမ်အချက်အလက် / အသေးစိတ်)
                </label>
                <button
                  type="button"
                  onClick={() => setIsBrokerBuilderOpen((prev) => !prev)}
                  className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  {isBrokerBuilderOpen
                    ? "✕ Close Broker Form"
                    : "📝 Broker Form"}
                </button>
              </div>

              {isBrokerBuilderOpen && (
                <div className="mb-2.5 p-3.5 rounded-xl bg-slate-50 border border-emerald-200 space-y-3 text-xs">
                  <div className="font-bold text-slate-800">
                    အိမ်အချက်အလက် Form ဖြည့်ရန် (လိုအပ်သလို ပြောင်းဖြည့်ပါ)
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-600 mb-1">
                        အလှည့်
                      </label>
                      <select
                        name="facing"
                        value={brokerForm.facing}
                        onChange={handleBrokerFieldChange}
                        className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                      >
                        <option value="မြောက်အလှည့်">မြောက်အလှည့်</option>
                        <option value="တောင်အလှည့်">တောင်အလှည့်</option>
                        <option value="အရှေ့အလှည့်">အရှေ့အလှည့်</option>
                        <option value="အနောက်အလှည့်">အနောက်အလှည့်</option>
                        <option value="အရှေ့မြောက်အလှည့်">
                          အရှေ့မြောက်အလှည့်
                        </option>
                        <option value="အရှေ့တောင်အလှည့်">
                          အရှေ့တောင်အလှည့်
                        </option>
                        <option value="အနောက်မြောက်အလှည့်">
                          အနောက်မြောက်အလှည့်
                        </option>
                        <option value="အနောက်တောင်အလှည့်">
                          အနောက်တောင်အလှည့်
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1">
                        ရေမီး အခြေအနေ
                      </label>
                      <select
                        name="utilities"
                        value={brokerForm.utilities}
                        onChange={handleBrokerFieldChange}
                        className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                      >
                        <option value="ရေမီးစုံ">ရေမီးစုံ</option>
                        <option value="မီတာပါ / ရေသန့်">မီတာပါ / ရေသန့်</option>
                        <option value="အဝီစိတွင်း / မီတာပါ">
                          အဝီစိတွင်း / မီတာပါ
                        </option>
                        <option value="မီတာလျှောက်ရန်">မီတာလျှောက်ရန်</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">
                      တိုက် / အိမ် အမျိုးအစား
                    </label>
                    <input
                      type="text"
                      name="buildingDesc"
                      value={brokerForm.buildingDesc}
                      onChange={handleBrokerFieldChange}
                      placeholder="ဥပမာ - နှစ်ထပ်ခွဲ RC တိုက်သစ် / ၆ လွှာ"
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-600 mb-1">
                        Master Bedroom
                      </label>
                      <input
                        type="text"
                        name="masterRooms"
                        value={brokerForm.masterRooms}
                        onChange={handleBrokerFieldChange}
                        placeholder="ဥပမာ - ၃ ခန်း (သို့) မပါ"
                        className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">
                        Single Bedroom
                      </label>
                      <input
                        type="text"
                        name="singleRooms"
                        value={brokerForm.singleRooms}
                        onChange={handleBrokerFieldChange}
                        placeholder="ဥပမာ - ၂ ခန်း"
                        className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">
                      အခြား အချက်အလက်များ (တစ်ကြောင်းချင်း ရေးပါ)
                    </label>
                    <textarea
                      name="extraFeatures"
                      rows="3"
                      value={brokerForm.extraFeatures}
                      onChange={handleBrokerFieldChange}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">
                      ဈေးနှုန်း / မှတ်ချက်
                    </label>
                    <input
                      type="text"
                      name="note"
                      value={brokerForm.note}
                      onChange={handleBrokerFieldChange}
                      placeholder="ဥပမာ - ညှိနှိုင်း / ပိုင်ရှင်တိုက်ရိုက်"
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setBrokerForm(INITIAL_BROKER_FORM)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-100 cursor-pointer"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyBrokerForm}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                    >
                      ✓ Apply to Description
                    </button>
                  </div>
                </div>
              )}

              <textarea
                name="description"
                rows="6"
                value={formData.description}
                onChange={handleChange}
                placeholder="အိမ်အချက်အလက်များ ရေးသားရန် (သို့မဟုတ် Broker Form နှိပ်၍ ဖြည့်ပါ)..."
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Upload Images/Documents (ပုံများ တင်ရန်)
              </label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !hasEnoughCoins}
              className={`w-full text-white font-medium py-2.5 rounded-lg transition duration-200 shadow-md ${
                hasEnoughCoins
                  ? "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {loading
                ? "Uploading & Posting..."
                : hasEnoughCoins
                  ? "Post Property (30 Coins ကျသင့်မည်)"
                  : "Coins မလုံလောက်ပါ"}
            </button>
          </form>
        </div>
      </div>

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

export default React.memo(AddPropertyModal);
