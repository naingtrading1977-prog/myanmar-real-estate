import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Navbar from "./components/Navbar";
import PropertyMap from "./components/PropertyMap";
import AuthModal from "./components/AuthModal";
import AddPropertyModal from "./components/AddPropertyModal";
import EditPropertyModal from "./components/EditPropertyModal";
import PropertyDetailModal from "./components/PropertyDetailModal";
import AdminDashboard from "./components/AdminDashboard";
import Footer from "./components/Footer";
import { logout } from "./store/authSlice";
import { getProperties, deleteProperty } from "./api/propertyApi";
import PropertyListTableModal from "./components/PropertyListTableModal";
import AboutUsModal from "./components/AboutUsModal"; // 👈 About Us Modal ကို ထည့်သွင်းခြင်း
import "./index.css";

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [properties, setProperties] = useState([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [cardImageIndices, setCardImageIndices] = useState({});
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false); // 👈 About Modal State

  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

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

  // 🔄 Component စတက်လာချိန်တွင် ဒေတာဆွဲထုတ်ခြင်း
  // 🔄 Component စတက်လာချိန်တွင် ဒေတာဆွဲထုတ်ခြင်း နှင့် Auto Slide လုပ်ဆောင်ခြင်း
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

  // 🔄 ပုံများကို ၃ စက္ကန့်တစ်ကြိမ် အလိုအလျောက် Slide ဖြစ်စေရန်
  useEffect(() => {
    const interval = setInterval(() => {
      setProperties((prevProperties) => {
        prevProperties.forEach((item) => {
          const images = item.images || [];
          if (images.length > 1) {
            setCardImageIndices((prev) => {
              const currentIndex = prev[item.id] || 0;
              const nextIndex = (currentIndex + 1) % images.length;
              return { ...prev, [item.id]: nextIndex };
            });
          }
        });
        return prevProperties;
      });
    }, 3000); // ၃ စက္ကန့်တစ်ကြိမ်

    return () => clearInterval(interval);
  }, []);

  const fetchPropertiesData = async () => {
    try {
      const res = await getProperties();
      const rawData = res.data || res;
      formatAndSetProperties(rawData);
    } catch (err) {
      console.error("Failed to load properties", err);
    }
  };

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
    if (window.confirm("ဒီကြော်ငြာကို ဖျက်မှာ သေချာပါသလား?")) {
      try {
        await deleteProperty(id);
        fetchPropertiesData();
      } catch (err) {
        console.error("Failed to delete property", err);
        alert("ဖျက်ရာတွင် အမှားအယွင်း ရှိနေပါသည်။");
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

    // 🌐 အကယ်၍ Cloudinary URL (သို့မဟုတ် http/https ပါသော URL) ဖြစ်ပါက တိုက်ရိုက်ပြန်ပေးမည်
    if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
      return imgPath;
    }

    // Local path ဖြစ်မှသာ baseURL နှင့် ပေါင်းမည်
    const formattedPath = imgPath.startsWith("/") ? imgPath : `/${imgPath}`;
    const API_HOST = import.meta.env.VITE_API_URL || "http://localhost:5002";
    const baseURL = API_HOST.replace(/\/api$/, "");

    return `${baseURL}${formattedPath}`;
  };

  const isAdmin =
    isAuthenticated && user && (user.role === "admin" || user.isAdmin);

  const activeProperties = properties.filter((item) => {
    const status = (item.status || "").trim();
    return (
      status !== "Sold" &&
      status !== "Rented" &&
      status !== "Hidden" &&
      status !== "အရောင်းပြီး" &&
      status !== "အငှားပြီး"
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      <div>
        <Navbar
          user={user}
          isAuthenticated={isAuthenticated}
          onLogout={() => dispatch(logout())}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenPostModal={() => setIsAddPropertyOpen(true)}
        />

        <div className="bg-emerald-600 text-white py-2 px-4 shadow-inner flex items-center">
          <span className="bg-emerald-700 text-xs font-bold px-2 py-1 rounded mr-3 uppercase tracking-wider">
            ကြော်ငြာ
          </span>
          <marquee scrollamount="5" className="text-sm font-medium">
            ✨ ရန်ကုန်မြို့တွင်း အကောင်းဆုံး အိမ်ခြံမြေ အရောင်း/အငှားများကို
            ယခုပဲ လွတ်လပ်စွာ ဝင်ရောက်ကြည့်ရှုနိုင်ပါပြီခင်ဗျာ! လူကြီးမင်းတို့၏
            ပိုင်ဆိုင်မှုများကိုလည်း ယုံကြည်စိတ်ချစွာ တင်ဆောင်နိုင်ပါသည်။ ✨
          </marquee>
        </div>

        <main className="max-w-7xl mx-auto p-6 space-y-6">
          {isAdmin ? (
            <AdminDashboard />
          ) : (
            <>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-4">
                  Location Map View
                </h2>
                <div className="rounded-xl overflow-hidden h-[450px] w-full">
                  <PropertyMap
                    properties={activeProperties}
                    onSelectProperty={handleCardClick}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold text-slate-800">
                    Available Listings
                  </h2>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {activeProperties.length} Properties
                  </span>
                </div>

                {activeProperties.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-sm">
                    <p className="text-slate-500 text-sm">
                      No properties listed yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeProperties.map((item) => {
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
                            {images.length > 0 && images[currentIndex] ? (
                              <>
                                <img
                                  src={imgUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                />

                                {images.length > 1 && (
                                  <>
                                    <button
                                      onClick={(e) =>
                                        handlePrevImage(
                                          e,
                                          item.id,
                                          images.length,
                                        )
                                      }
                                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition text-sm"
                                    >
                                      ❮
                                    </button>
                                    <button
                                      onClick={(e) =>
                                        handleNextImage(
                                          e,
                                          item.id,
                                          images.length,
                                        )
                                      }
                                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition text-sm"
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
                                🏠 No Image
                              </div>
                            )}

                            <div className="absolute top-3 left-3 flex gap-2">
                              <span className="bg-slate-900/70 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                                {item.property_type || item.type}
                              </span>
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isRent ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"}`}
                              >
                                {isRent ? "အငှား" : "အရောင်း"}
                              </span>
                            </div>
                          </div>

                          <div className="p-5 flex flex-col justify-between flex-grow space-y-4">
                            <div>
                              <h3 className="font-bold text-base text-slate-800 group-hover:text-emerald-600 transition line-clamp-1">
                                {item.title}
                              </h3>

                              <div className="flex items-center justify-between mt-2 text-xs font-semibold text-slate-600">
                                <div className="flex items-center gap-1">
                                  <span className="text-amber-500">⭐</span>
                                  <span className="font-bold text-slate-800">
                                    {Number(item.average_rating || 0).toFixed(
                                      1,
                                    )}
                                  </span>
                                  <span className="text-slate-400">
                                    ({item.total_ratings || 0})
                                  </span>
                                </div>
                                <div className="text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
                                  👀 {item.views || 0} ဦးကြည့်
                                </div>
                              </div>

                              <div className="mt-3 flex items-baseline justify-between">
                                <span className="text-emerald-600 font-extrabold text-lg">
                                  {item.price}{" "}
                                  <span className="text-sm font-normal text-slate-600">
                                    {isRent ? "သိန်း / လ" : "သိန်း"}
                                  </span>
                                </span>
                              </div>
                            </div>

                            {isOwnerOrAdmin && (
                              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                  onClick={(e) => handleEditClick(e, item)}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition"
                                >
                                  ✏ Edit
                                </button>
                                <button
                                  onClick={(e) => handleDeleteClick(e, item.id)}
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
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Footer with both handlers */}
      <Footer
        onOpenListings={() => setIsTableModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
      />

      <PropertyListTableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        properties={activeProperties}
        onSelectProperty={handleCardClick}
      />

      <AboutUsModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <AddPropertyModal
        isOpen={isAddPropertyOpen}
        onClose={() => setIsAddPropertyOpen(false)}
        onPropertyAdded={fetchPropertiesData}
      />

      <EditPropertyModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        property={selectedProperty}
        onPropertyUpdated={fetchPropertiesData}
      />

      <PropertyDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        property={selectedProperty}
        onPropertyUpdated={fetchPropertiesData}
      />
    </div>
  );
}

export default App;
