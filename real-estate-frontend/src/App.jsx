import React, { useState, useEffect } from "react";
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
import "./index.css";

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [properties, setProperties] = useState([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [cardImageIndices, setCardImageIndices] = useState({});

  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const fetchPropertiesData = async () => {
    try {
      const res = await getProperties();
      if (res && res.data) {
        const formattedProperties = res.data.map((p) => ({
          ...p,
          id: p.id,
          title: p.title,
          description: p.description,
          price: p.price,
          type: p.property_type || p.type || "Apartment",
          listing_type:
            p.listing_type || (p.status === "For Rent" ? "Rent" : "Sale"),
          status: p.status || "Available",
          lat: parseFloat(p.latitude) || 16.8409,
          lng: parseFloat(p.longitude) || 96.1735,
          images: p.images || [],
          owner_id: p.owner_id,
          contact_phone: p.contact_phone || "",
          views: p.views || 0,
          average_rating: p.average_rating || 0,
        }));
        setProperties(formattedProperties);
      } else if (Array.isArray(res)) {
        setProperties(res);
      }
    } catch (err) {
      console.error("Failed to load properties", err);
    }
  };

  useEffect(() => {
    fetchPropertiesData();
  }, []);

  // 🛠️ Auto Slide Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCardImageIndices((prev) => {
        const updated = { ...prev };
        properties.forEach((item) => {
          const images = item.images || [];
          if (images.length > 1) {
            const currentIndex = prev[item.id] || 0;
            updated[item.id] = (currentIndex + 1) % images.length;
          }
        });
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [properties]);

  const handleCardClick = (item) => {
    setSelectedProperty(item);
    setIsDetailModalOpen(true);
  };

  // 🛠️ Edit ပြုလုပ်ရန် Modal ဖွင့်ခြင်း
  const handleEditClick = (e, item) => {
    e.stopPropagation();
    setSelectedProperty(item);
    setIsEditModalOpen(true);
  };

  // 🛠️️ Delete ပြုလုပ်ခြင်း
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

  // 🖼️ ပုံလိပ်စာ အမှန်ရရှိရန် Helper Function (Fixed)
  const getImageUrl = (rawImg) => {
    if (!rawImg) return "";
    let imgPath = "";

    if (typeof rawImg === "string") {
      imgPath = rawImg;
    } else if (typeof rawImg === "object") {
      imgPath = rawImg.url || rawImg.image_path || rawImg.path || "";
    }

    if (!imgPath) return "";
    if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
      return imgPath;
    }

    // ပုံ path စတင်ရာတွင် slash ပါမပါ စစ်ဆေးခြင်း
    const formattedPath = imgPath.startsWith("/") ? imgPath : `/${imgPath}`;
    return `https://myanmar-real-estate-1.onrender.com${formattedPath}`;
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

        {/* 📢 Announcement / Marquee Banner */}
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
              {/* 🗺️ Location Map View */}
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

              {/* 🏠 Available Listings */}
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

                      console.log("Property Item:", item);
                      console.log("Current User:", user);
                      console.log("Is Owner or Admin?:", isOwnerOrAdmin);

                      // 🛠️ Edit / Delete ခလုတ်ပေါ်စေရန် ပိုင်ရှင် သို့မဟုတ် Admin ဟုတ်မဟုတ် သေချာစစ်ဆေးခြင်း
                      const isOwnerOrAdmin =
                        isAuthenticated &&
                        user &&
                        (user.role === "admin" ||
                          user.isAdmin ||
                          String(user.id) === String(item.owner_id) ||
                          String(user._id) === String(item.owner_id));

                      const imgUrl = getImageUrl(images[currentIndex]);

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleCardClick(item)}
                          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                        >
                          <div className="h-48 bg-slate-900 relative overflow-hidden">
                            {images.length > 0 ? (
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
                              <div className="mt-2 flex items-baseline justify-between">
                                <span className="text-emerald-600 font-extrabold text-lg">
                                  {item.price}{" "}
                                  <span className="text-sm font-normal text-slate-600">
                                    {isRent ? "သိန်း / လ" : "သိန်း"}
                                  </span>
                                </span>
                              </div>
                            </div>

                            {/* 🛠 Edit / Delete ခလုတ်များ */}
                            {isOwnerOrAdmin && (
                              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                  onClick={(e) => handleEditClick(e, item)}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={(e) => handleDeleteClick(e, item.id)}
                                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition"
                                >
                                  🗑️ Delete
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

      <Footer />

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
