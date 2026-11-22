import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Navbar from "./components/Navbar";
import PropertyMap from "./components/PropertyMap";
import AuthModal from "./components/AuthModal";
import AddPropertyModal from "./components/AddPropertyModal";
import EditPropertyModal from "./components/EditPropertyModal";
import PropertyDetailModal from "./components/PropertyDetailModal";
import Footer from "./components/Footer";
import { logout } from "./store/authSlice";
import { getProperties, deleteProperty } from "./api/propertyApi";
import PropertyListTableModal from "./components/PropertyListTableModal";
import AboutUsModal from "./components/AboutUsModal";
import "./index.css";

// ✅ Route / Role အလိုက် လိုမှ load ဖြစ်မယ့် component များ
const AgentsPage = lazy(() => import("./components/AgentsPage"));
const WantedListingsPage = lazy(
  () => import("./components/WantedListingsPage"),
);
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));

function App() {
  const location = useLocation();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [properties, setProperties] = useState([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [cardImageIndices, setCardImageIndices] = useState({});
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const [brokenImageKeys, setBrokenImageKeys] = useState({});

  // 🌐 Language & Phase 1 Category Filter States
  const [language, setLanguage] = useState(
    localStorage.getItem("app_lang") || "mm",
  );
  const [activeFilter, setActiveFilter] = useState({
    listingType: "",
    category: "",
    township: "",
    minPrice: "",
    maxPrice: "",
    searchQuery: "",
  });

  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const t = {
    adBadge: language === "en" ? "ANNOUNCEMENT" : "ကြော်ငြာ",
    marqueeText:
      language === "en"
        ? "✨ Explore top real estate properties for sale and rent across Yangon! List your properties with confidence anytime. ✨"
        : "✨ ရန်ကုန်မြို့တွင်း အကောင်းဆုံး အိမ်ခြံမြေ အရောင်း/အငှားများကို ယခုပဲ လွတ်လပ်စွာ ဝင်ရောက်ကြည့်ရှုနိုင်ပါပြီခင်ဗျာ! လူကြီးမင်းတို့၏ ပိုင်ဆိုင်မှုများကိုလည်း ယုံကြည်စိတ်ချစွာ တင်ဆောင်နိုင်ပါသည်။ ✨",
    mapTitle: language === "en" ? "Location Map View" : "Location Map View",
    latestTitle: language === "en" ? "Latest Listings" : "Latest Listings",
    latestBadge: language === "en" ? "Latest" : "Latest",
    propertiesCount: language === "en" ? "Properties" : "Properties",
    viewAll: language === "en" ? "View All" : "View All",
    viewAllListings:
      language === "en" ? "View All Listings" : "View All Listings",
    noProperties:
      language === "en"
        ? "No matching properties found."
        : "ကိုက်ညီသော အိမ်ခြံမြေ စာရင်း မရှိသေးပါ။",
    clearFilter: language === "en" ? "Reset Filter" : "Filter ရှင်းရန်",
    showingFilter:
      language === "en" ? "Filtered by:" : "ရွေးချယ်ထားသော အမျိုးအစား:",
    rentLabel: language === "en" ? "For Rent" : "အငှား",
    saleLabel: language === "en" ? "For Sale" : "အရောင်း",
    pricePerMonth: language === "en" ? "Lakhs / mo" : "သိန်း / လ",
    priceLakhs: language === "en" ? "Lakhs" : "သိန်း",
    viewsSuffix: language === "en" ? "views" : "ဦးကြည့်",
    noImage: language === "en" ? "No Image" : "No Image",
    confirmDelete:
      language === "en"
        ? "Are you sure you want to delete this listing?"
        : "ဒီကြော်ငြာကို ဖျက်မှာ သေချာပါသလား?",
    deleteError:
      language === "en"
        ? "Failed to delete property."
        : "ဖျက်ရာတွင် အမှားအယွင်း ရှိနေပါသည်။",
  };

  // 🔄 Property ဒေတာများကို ပုံစံချပေးပြီး State ထဲသို့ သိမ်းဆည်းသည့် Helper Function
  const formatAndSetProperties = (rawData) => {
    if (!Array.isArray(rawData)) return;
    const formattedProperties = rawData.map((p) => {
      let parsedImages = [];
      if (Array.isArray(p.images)) {
        parsedImages = p.images
          .map((img) => {
            if (typeof img === "string") return img;
            if (typeof img === "object" && img !== null) {
              return (
                img.url ||
                img.image_path ||
                img.path ||
                img.secure_url ||
                img.imageUrl ||
                ""
              );
            }
            return "";
          })
          .filter(Boolean);
      } else if (typeof p.images === "string") {
        try {
          const parsed = JSON.parse(p.images);
          if (Array.isArray(parsed)) {
            parsedImages = parsed
              .map((img) =>
                typeof img === "string"
                  ? img
                  : img?.url || img?.image_path || img?.path || "",
              )
              .filter(Boolean);
          } else {
            parsedImages = [p.images];
          }
        } catch {
          parsedImages = [p.images];
        }
      }

      return {
        ...p,
        id: p.id || p._id,
        title: p.title || "Untitled Property",
        description: p.description || "",
        price: p.price || 0,
        type: p.property_type || p.type || "Apartment",
        listing_type:
          p.listing_type || (p.status === "For Rent" ? "Rent" : "Sale"),
        status: p.status || "Available",
        lat: parseFloat(p.latitude) || 16.8409,
        lng: parseFloat(p.longitude) || 96.1735,
        images: parsedImages,
        owner_id: p.owner_id || p.user_id,
        contact_phone: p.contact_phone || "",
        views: p.views || 0,
        average_rating: p.average_rating || 0,
        total_ratings: p.total_ratings || 0,
      };
    });
    setProperties(formattedProperties);
  };

  const fetchPropertiesData = async () => {
    try {
      const res = await getProperties();
      const rawData = res.data || res;
      formatAndSetProperties(rawData);
    } catch (err) {
      console.error("Failed to load properties", err);
    }
  };

  // 🔄 Component စတက်လာချိန်တွင် ဒေတာဆွဲထုတ်ခြင်း
  useEffect(() => {
    let isMounted = true;

    const loadInitialProperties = async () => {
      try {
        const res = await getProperties();
        const rawData = res.data || res;
        if (isMounted) {
          formatAndSetProperties(rawData);
        }
      } catch (err) {
        console.error("Failed to load properties", err);
      }
    };

    loadInitialProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  // ✅ Route ပြောင်းတိုင်း page အပေါ်ဆုံး ပြန်တက်စေရန် သပ်သပ်ထည့်သော useEffect
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const isAdmin =
    isAuthenticated && user && (user.role === "admin" || user.isAdmin);

  const activeProperties = useMemo(() => {
    return properties.filter((item) => {
      const status = (item.status || "").trim();
      return (
        status !== "Sold" &&
        status !== "Rented" &&
        status !== "Hidden" &&
        status !== "အရောင်းပြီး" &&
        status !== "အငှားပြီး"
      );
    });
  }, [properties]);

  const availableTownships = useMemo(() => {
    const set = new Set();
    activeProperties.forEach((item) => {
      const tName = (item.township || item.city || "").trim();
      if (tName) set.add(tName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [activeProperties]);

  // 🔎 Navbar Category & Listing Type Filter
  const filteredProperties = useMemo(() => {
    return activeProperties.filter((item) => {
      if (activeFilter.listingType) {
        const itemType = (item.listing_type || "").toLowerCase();
        if (itemType !== activeFilter.listingType.toLowerCase()) {
          return false;
        }
      }

      if (activeFilter.category) {
        const propCat = (item.property_type || item.type || "").toLowerCase();
        if (propCat !== activeFilter.category.toLowerCase()) {
          return false;
        }
      }

      if (activeFilter.township) {
        const propTownship = (item.township || item.city || "").toLowerCase();
        if (propTownship !== activeFilter.township.toLowerCase()) {
          return false;
        }
      }

      const priceNum = Number(item.price || 0);
      if (
        activeFilter.minPrice !== "" &&
        !Number.isNaN(Number(activeFilter.minPrice))
      ) {
        if (priceNum < Number(activeFilter.minPrice)) {
          return false;
        }
      }
      if (
        activeFilter.maxPrice !== "" &&
        !Number.isNaN(Number(activeFilter.maxPrice))
      ) {
        if (priceNum > Number(activeFilter.maxPrice)) {
          return false;
        }
      }

      if (activeFilter.searchQuery && activeFilter.searchQuery.trim() !== "") {
        const q = activeFilter.searchQuery.trim().toLowerCase();
        const haystack = [
          item.title,
          item.description,
          item.township,
          item.city,
          item.property_type,
          item.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [activeProperties, activeFilter]);

  // 🕒 Latest အသစ်တင်ထားတာတွေ ဦးစားပေးစီခြင်း
  const latestProperties = useMemo(() => {
    return [...filteredProperties].sort((a, b) => {
      if (a.created_at && b.created_at) {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [filteredProperties]);

  // 📌 Main Page တွင် ထိပ်ဆုံး Latest ၃ ခုသာ ပြရန်
  const displayedProperties = useMemo(
    () => latestProperties.slice(0, 3),
    [latestProperties],
  );

  // 🔄 ပုံများကို ၃ စက္ကန့်တစ်ကြိမ် အလိုအလျောက် Slide ဖြစ်စေရန်
  useEffect(() => {
    const interval = setInterval(() => {
      setCardImageIndices((prev) => {
        const updated = { ...prev };
        displayedProperties.forEach((item) => {
          const images = item.images || [];
          if (images.length > 1) {
            const currentIndex = updated[item.id] || 0;
            updated[item.id] = (currentIndex + 1) % images.length;
          }
        });
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [displayedProperties]);

  const handleCardClick = (item) => {
    setSelectedProperty(item);
    setIsDetailModalOpen(true);
  };

  const handleEditClick = (e, item) => {
    e.stopPropagation();
    setSelectedProperty(item);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (e, id) => {
    e.stopPropagation();
    if (window.confirm(t.confirmDelete)) {
      try {
        await deleteProperty(id);
        fetchPropertiesData();
      } catch (err) {
        console.error("Failed to delete property", err);
        alert(t.deleteError);
      }
    }
  };

  const handleNextImage = (e, propertyId, totalImages) => {
    e.stopPropagation();
    setCardImageIndices((prev) => {
      const currentIndex = prev[propertyId] || 0;
      const nextIndex = (currentIndex + 1) % totalImages;
      return { ...prev, [propertyId]: nextIndex };
    });
  };

  const handlePrevImage = (e, propertyId, totalImages) => {
    e.stopPropagation();
    setCardImageIndices((prev) => {
      const currentIndex = prev[propertyId] || 0;
      const prevIndex = (currentIndex - 1 + totalImages) % totalImages;
      return { ...prev, [propertyId]: prevIndex };
    });
  };

  const getImageUrl = (rawImg) => {
    if (!rawImg) return "";
    let imgPath = "";

    if (typeof rawImg === "string") {
      imgPath = rawImg;
    } else if (typeof rawImg === "object" && rawImg !== null) {
      imgPath =
        rawImg.url ||
        rawImg.image_path ||
        rawImg.path ||
        rawImg.secure_url ||
        rawImg.imageUrl ||
        "";
    }

    if (!imgPath) return "";

    if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
      return imgPath;
    }

    const formattedPath = imgPath.startsWith("/") ? imgPath : `/${imgPath}`;
    const API_HOST = import.meta.env.VITE_API_URL || "http://localhost:5002";
    const baseURL = API_HOST.replace(/\/api$/, "");

    return `${baseURL}${formattedPath}`;
  };

  const hasActiveFilter = Boolean(
    activeFilter.listingType || activeFilter.category,
  );

  const formatPrice = (rawPrice) => {
    const num = Number(rawPrice);
    if (Number.isNaN(num)) return rawPrice;
    return Number.isInteger(num) ? num.toLocaleString() : num.toString();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      <div>
        <Navbar
          user={user}
          isAuthenticated={isAuthenticated}
          onLogout={() => dispatch(logout())}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenPostModal={() => setIsAddPropertyOpen(true)}
          onSelectCategory={(filterObj) => setActiveFilter(filterObj)}
          language={language}
          onChangeLanguage={(nextLang) => setLanguage(nextLang)}
        />

        <div className="bg-emerald-600 text-white py-2 px-4 shadow-inner flex items-center">
          <span className="bg-emerald-700 text-xs font-bold px-2 py-1 rounded mr-3 uppercase tracking-wider">
            {t.adBadge}
          </span>
          <marquee scrollamount="5" className="text-sm font-medium">
            {t.marqueeText}
          </marquee>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5 sm:space-y-6">
          <Suspense
            fallback={
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
                Loading...
              </div>
            }
          >
            {location.pathname === "/agents" ? (
              <AgentsPage
                properties={activeProperties}
                language={language}
                onSelectProperty={handleCardClick}
              />
            ) : location.pathname === "/wanted" ? (
              <WantedListingsPage
                language={language}
                isAuthenticated={isAuthenticated}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            ) : isAdmin ? (
              <AdminDashboard />
            ) : (
              <>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <input
                    type="text"
                    value={activeFilter.searchQuery}
                    onChange={(e) =>
                      setActiveFilter((prev) => ({
                        ...prev,
                        searchQuery: e.target.value,
                      }))
                    }
                    placeholder={
                      language === "en"
                        ? "Search title, township..."
                        : "ခေါင်းစဉ် / မြို့နယ် ရှာရန်..."
                    }
                    className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <select
                    value={activeFilter.township}
                    onChange={(e) =>
                      setActiveFilter((prev) => ({
                        ...prev,
                        township: e.target.value,
                      }))
                    }
                    className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">
                      {language === "en" ? "All Townships" : "မြို့နယ် အားလုံး"}
                    </option>
                    {availableTownships.map((tw) => (
                      <option key={tw} value={tw}>
                        {tw}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0"
                    value={activeFilter.minPrice}
                    onChange={(e) =>
                      setActiveFilter((prev) => ({
                        ...prev,
                        minPrice: e.target.value,
                      }))
                    }
                    placeholder={
                      language === "en" ? "Min Lakhs" : "အနည်းဆုံး (သိန်း)"
                    }
                    className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <input
                    type="number"
                    min="0"
                    value={activeFilter.maxPrice}
                    onChange={(e) =>
                      setActiveFilter((prev) => ({
                        ...prev,
                        maxPrice: e.target.value,
                      }))
                    }
                    placeholder={
                      language === "en" ? "Max Lakhs" : "အများဆုံး (သိန်း)"
                    }
                    className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setActiveFilter({
                        listingType: "",
                        category: "",
                        township: "",
                        minPrice: "",
                        maxPrice: "",
                        searchQuery: "",
                      })
                    }
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl px-3 py-2 transition cursor-pointer"
                  >
                    {t.clearFilter}
                  </button>
                </div>

                {hasActiveFilter && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
                    <div className="flex flex-wrap items-center gap-2 font-medium text-emerald-900">
                      <span>{t.showingFilter}</span>
                      {activeFilter.listingType && (
                        <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-bold text-xs">
                          {activeFilter.listingType}
                        </span>
                      )}
                      {activeFilter.category && (
                        <span className="bg-white text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold text-xs">
                          {activeFilter.category}
                        </span>
                      )}
                      {activeFilter.township && (
                        <span className="bg-white text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold text-xs">
                          📍 {activeFilter.township}
                        </span>
                      )}
                      {(activeFilter.minPrice !== "" ||
                        activeFilter.maxPrice !== "") && (
                        <span className="bg-white text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold text-xs">
                          💰 {activeFilter.minPrice || "0"} -{" "}
                          {activeFilter.maxPrice || "∞"} {t.priceLakhs}
                        </span>
                      )}
                      {activeFilter.searchQuery && (
                        <span className="bg-white text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold text-xs">
                          🔎 "{activeFilter.searchQuery}"
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveFilter({
                          listingType: "",
                          category: "",
                          township: "",
                          minPrice: "",
                          maxPrice: "",
                          searchQuery: "",
                        })
                      }
                      className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                    >
                      {t.clearFilter}
                    </button>
                  </div>
                )}

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">
                    {t.mapTitle}
                  </h2>
                  <div className="rounded-xl overflow-hidden h-75 sm:h-105 lg:h-112.5 w-full">
                    <PropertyMap
                      properties={filteredProperties}
                      onSelectProperty={handleCardClick}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-slate-800">
                        {t.latestTitle}
                      </h2>
                      <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {t.latestBadge}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {filteredProperties.length} {t.propertiesCount}
                      </span>
                      {filteredProperties.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setIsTableModalOpen(true)}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full transition cursor-pointer"
                        >
                          {t.viewAll} ({filteredProperties.length}) →
                        </button>
                      )}
                    </div>
                  </div>

                  {displayedProperties.length === 0 ? (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-sm space-y-3">
                      <p className="text-slate-500 text-sm">{t.noProperties}</p>
                      {hasActiveFilter && (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveFilter({
                              listingType: "",
                              category: "",
                              township: "",
                              minPrice: "",
                              maxPrice: "",
                              searchQuery: "",
                            })
                          }
                          className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                        >
                          {t.clearFilter}
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedProperties.map((item) => {
                          const isRent = item.listing_type === "Rent";
                          const images = item.images || [];
                          const currentIndex = cardImageIndices[item.id] || 0;

                          const isOwnerOrAdmin =
                            isAuthenticated &&
                            user &&
                            (user.role === "admin" ||
                              user.isAdmin ||
                              String(user.id || user._id) ===
                                String(item.owner_id));

                          const imgUrl = getImageUrl(images[currentIndex]);

                          return (
                            <div
                              key={item.id}
                              onClick={() => handleCardClick(item)}
                              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                            >
                              <div className="h-48 bg-slate-900 relative overflow-hidden">
                                {images.length > 0 &&
                                images[currentIndex] &&
                                !brokenImageKeys[
                                  `${item.id}-${currentIndex}`
                                ] ? (
                                  <>
                                    <img
                                      src={imgUrl}
                                      alt={item.title}
                                      loading="lazy"
                                      decoding="async"
                                      onError={() =>
                                        setBrokenImageKeys((prev) => ({
                                          ...prev,
                                          [`${item.id}-${currentIndex}`]: true,
                                        }))
                                      }
                                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                    />

                                    {images.length > 1 && (
                                      <>
                                        <button
                                          type="button"
                                          aria-label="Previous image"
                                          onClick={(e) =>
                                            handlePrevImage(
                                              e,
                                              item.id,
                                              images.length,
                                            )
                                          }
                                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition text-sm cursor-pointer"
                                        >
                                          ❮
                                        </button>
                                        <button
                                          type="button"
                                          aria-label="Next image"
                                          onClick={(e) =>
                                            handleNextImage(
                                              e,
                                              item.id,
                                              images.length,
                                            )
                                          }
                                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition text-sm cursor-pointer"
                                        >
                                          ❯
                                        </button>

                                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md font-medium">
                                          {currentIndex + 1} / {images.length}
                                        </span>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-sm font-medium">
                                    🏠 {t.noImage}
                                  </div>
                                )}

                                <div className="absolute top-3 left-3 flex gap-2">
                                  <span className="bg-slate-900/70 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                                    {item.property_type || item.type}
                                  </span>
                                  <span
                                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isRent ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"}`}
                                  >
                                    {isRent ? t.rentLabel : t.saleLabel}
                                  </span>
                                </div>
                              </div>

                              <div className="p-5 flex flex-col justify-between flex-grow space-y-3">
                                <div>
                                  <h3 className="font-bold text-base text-slate-800 group-hover:text-emerald-600 transition line-clamp-1">
                                    {item.title}
                                  </h3>

                                  <p className="text-xs text-slate-500 mt-1 flex items-center justify-between gap-2">
                                    <span className="truncate">
                                      📍{" "}
                                      {item.township || item.city || "ရန်ကုန်"}
                                    </span>
                                    {item.area_sqft ? (
                                      <span className="shrink-0 font-semibold text-slate-600">
                                        📐 {Number(item.area_sqft)} sq.ft
                                      </span>
                                    ) : null}
                                  </p>

                                  <div className="flex items-center justify-between mt-2.5 text-xs font-semibold text-slate-600">
                                    <div className="flex items-center gap-1">
                                      <span className="text-amber-500">⭐</span>
                                      <span className="font-bold text-slate-800">
                                        {Number(
                                          item.average_rating || 0,
                                        ).toFixed(1)}
                                      </span>
                                      <span className="text-slate-400">
                                        ({item.total_ratings || 0})
                                      </span>
                                    </div>
                                    <div className="text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
                                      👀 {item.views || 0} {t.viewsSuffix}
                                    </div>
                                  </div>

                                  <div className="mt-3 flex items-baseline justify-between">
                                    <span className="text-emerald-600 font-extrabold text-lg">
                                      {formatPrice(item.price)}{" "}
                                      <span className="text-sm font-normal text-slate-600">
                                        {isRent
                                          ? t.pricePerMonth
                                          : t.priceLakhs}
                                      </span>
                                    </span>
                                  </div>
                                </div>

                                {isOwnerOrAdmin && (
                                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={(e) => handleEditClick(e, item)}
                                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition"
                                    >
                                      ✏ Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) =>
                                        handleDeleteClick(e, item.id)
                                      }
                                      className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition"
                                    >
                                      🗑 Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {filteredProperties.length > 0 && (
                        <div className="pt-2 flex justify-center">
                          <button
                            type="button"
                            onClick={() => setIsTableModalOpen(true)}
                            className="px-6 py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 font-semibold text-sm rounded-xl border border-emerald-200 shadow-sm transition cursor-pointer"
                          >
                            {t.viewAllListings} ({filteredProperties.length})
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </Suspense>
        </main>
      </div>

      <Footer
        onOpenListings={() => setIsTableModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
      />

      {isTableModalOpen && (
        <PropertyListTableModal
          isOpen={isTableModalOpen}
          onClose={() => setIsTableModalOpen(false)}
          properties={filteredProperties}
          onSelectProperty={handleCardClick}
        />
      )}

      {isAboutModalOpen && (
        <AboutUsModal
          isOpen={isAboutModalOpen}
          onClose={() => setIsAboutModalOpen(false)}
        />
      )}

      {isAuthOpen && (
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      )}

      {isAddPropertyOpen && (
        <AddPropertyModal
          isOpen={isAddPropertyOpen}
          onClose={() => setIsAddPropertyOpen(false)}
          onPropertyAdded={fetchPropertiesData}
        />
      )}

      {isEditModalOpen && (
        <EditPropertyModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          property={selectedProperty}
          onPropertyUpdated={fetchPropertiesData}
        />
      )}

      {isDetailModalOpen && (
        <PropertyDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          property={selectedProperty}
          onPropertyUpdated={fetchPropertiesData}
          language={language}
        />
      )}
    </div>
  );
}

export default App;
