import API from "./axios";

// Property အသစ် တင်ရန် (Create)
export const createProperty = async (formData) => {
  const response = await API.post("/properties", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Property စာရင်းများ ရယူရန် (Read)
export const getProperties = async () => {
  const response = await API.get("/properties");
  return response.data;
};

// 🛠️ Property အချက်အလက်များ ပြင်ဆင်ရန် (Update)
export const updateProperty = async (id, propertyData) => {
  const response = await API.put(`/properties/${id}`, propertyData);
  return response.data;
};

// 🛠️ Property ဖျက်ရန် (Delete)
export const deleteProperty = async (id) => {
  const response = await API.delete(`/properties/${id}`);
  return response.data;
};
