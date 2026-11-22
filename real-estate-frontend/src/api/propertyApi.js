import API from "./axios";

const PROPERTIES_CACHE_TTL_MS = 45 * 1000; // 45 seconds
let cachedPropertiesData = null;
let cachedAt = 0;

export const invalidatePropertiesCache = () => {
  cachedPropertiesData = null;
  cachedAt = 0;
};

// Property အသစ် တင်ရန် (Create)
export const createProperty = async (formData) => {
  const response = await API.post("/properties", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  invalidatePropertiesCache();
  return response.data;
};

// Property စာရင်းများ ရယူရန် (Read)
export const getProperties = async (options = {}) => {
  const { forceRefresh = false } = options;
  const now = Date.now();

  if (
    !forceRefresh &&
    cachedPropertiesData !== null &&
    now - cachedAt < PROPERTIES_CACHE_TTL_MS
  ) {
    return cachedPropertiesData;
  }

  const response = await API.get("/properties");
  cachedPropertiesData = response.data;
  cachedAt = now;
  return response.data;
};

// 🛠️ Property အချက်အလက်များ ပြင်ဆင်ရန် (Update)
export const updateProperty = async (id, propertyData) => {
  const response = await API.put(`/properties/${id}`, propertyData);
  invalidatePropertiesCache();
  return response.data;
};

// 🛠️ Property ဖျက်ရန် (Delete)
export const deleteProperty = async (id) => {
  const response = await API.delete(`/properties/${id}`);
  invalidatePropertiesCache();
  return response.data;
};
