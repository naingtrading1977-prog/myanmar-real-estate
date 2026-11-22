import { useState, useEffect } from "react";
import { updateProperty } from "../api/propertyApi";

const INITIAL_FORM = {
  title: "",
  description: "",
  price: "",
  type: "Apartment",
  listing_type: "Sale",
  township: "",
  lat: "",
  lng: "",
  contact_phone: "",
  ownership_document: "ဂရန် (Grant)",
  building_status: "BCC ကျပြီး / လူနေထိုင်ခွင့် ကျပြီး",
};

const EditPropertyModal = ({
  isOpen,
  onClose,
  property,
  onPropertyUpdated,
  language,
}) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || "",
        description: property.description || "",
        price: property.price || "",
        type: property.property_type || property.type || "Apartment",
        listing_type:
          property.listing_type ||
          (property.status === "For Rent" ? "Rent" : "Sale"),
        township: property.township || property.address || "",
        lat: property.latitude || property.lat || "",
        lng: property.longitude || property.lng || "",
        contact_phone: property.contact_phone || "",
        ownership_document: property.ownership_document || "ဂရန် (Grant)",
        building_status:
          property.building_status || "BCC ကျပြီး / လူနေထိုင်ခွင့် ကျပြီး",
      });
    }
  }, [property]);

  if (!isOpen || !property) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const resolvedStatus =
        formData.listing_type === "Rent"
          ? "For Rent"
          : formData.listing_type === "Pre-sale"
            ? "Pre-sale"
            : "For Sale";

      const uploadData = new FormData();
      uploadData.append("title", formData.title.trim());
      uploadData.append("description", formData.description);
      uploadData.append("price", formData.price);
      uploadData.append("property_type", formData.type);
      uploadData.append("listing_type", formData.listing_type);
      uploadData.append("status", resolvedStatus);
      uploadData.append("township", formData.township.trim());
      uploadData.append("latitude", formData.lat);
      uploadData.append("longitude", formData.lng);
      uploadData.append("contact_phone", formData.contact_phone.trim());
      uploadData.append("ownership_document", formData.ownership_document);
      uploadData.append("building_status", formData.building_status);

      for (let i = 0; i < files.length; i++) {
        uploadData.append("images", files[i]);
      }

      await updateProperty(property.id, uploadData);
      if (typeof onPropertyUpdated === "function") {
        onPropertyUpdated();
      }
      if (typeof onClose === "function") {
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/50 z-[9999] flex justify-center items-center p-4 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
        >
          ✕
        </button>

        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-800">
          Edit Property
        </h2>

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
              className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Listing Type (ကြော်ငြာအမျိုးအစား)
              </label>
              <select
                name="listing_type"
                value={formData.listing_type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-semibold text-emerald-700 bg-emerald-50/50"
              >
                <option value="Sale">🏷️ အရောင်း (For Sale)</option>
                <option value="Rent">🏠 အငှား (For Rent)</option>
                <option value="Pre-sale">🏗️ ကြိုပွိုင့် (Pre-sale)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type (အမျိုးအစား)
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="Apartment">Apartment (တိုက်ခန်း)</option>
                <option value="Condo">Condo (ကွန်ဒို)</option>
                <option value="Land">Land Plot (မြေကွက်)</option>
                <option value="Villa">Villa / House (လုံးချင်းအိမ်)</option>
                <option value="Commercial">
                  Commercial / Office (ဆိုင်ခန်း / ရုံးခန်း)
                </option>
                <option value="Restaurant">Restaurant (စားသောက်ဆိုင်)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price (
                {formData.listing_type === "Rent"
                  ? "တစ်လ (ကျပ်/သိန်း)"
                  : "သိန်း"}
                )
              </label>
              <input
                type="number"
                name="price"
                required
                value={formData.price}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Township / Location (တည်နေရာ)
              </label>
              <input
                type="text"
                name="township"
                required
                value={formData.township}
                onChange={handleChange}
                placeholder="ဥပမာ - တောင်ဒဂုံ"
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Latitude (မြေပုံ မျဉ်းပြိုင်)
              </label>
              <input
                type="number"
                step="any"
                name="lat"
                required
                value={formData.lat}
                onChange={handleChange}
                placeholder="e.g. 16.8409"
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Longitude (မြေပုံ မျဉ်းထောင်)
              </label>
              <input
                type="number"
                step="any"
                name="lng"
                required
                value={formData.lng}
                onChange={handleChange}
                placeholder="e.g. 96.1735"
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ownership Document (ပိုင်ဆိုင်မှု)
              </label>
              <select
                name="ownership_document"
                value={formData.ownership_document}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="ဂရန် (Grant)">ဂရန် (Grant)</option>
                <option value="ပါမစ် (Permit)">ပါမစ် (Permit)</option>
                <option value="ဘိုးဘွားပိုင်မြေ (Freehold)">
                  ဘိုးဘွားပိုင်မြေ (Freehold)
                </option>
                <option value="ဂရန်အမည်ပေါက် (Grant Name Transfer)">
                  ဂရန်အမည်ပေါက်
                </option>
                <option value="အခြား (Other)">အခြား (Other)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Building Status (BCC နှင့် လူနေထိုင်ခွင့် အခြေအနေ)
            </label>
            <select
              name="building_status"
              value={formData.building_status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description (အသေးစိတ် ဖော်ပြချက်)
            </label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Upload New Images/Documents (optional)
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
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition duration-200 cursor-pointer"
          >
            {loading ? "Saving Changes..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditPropertyModal;
