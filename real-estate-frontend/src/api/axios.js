import axios from "axios";

const API = axios.create({
  baseURL: "https://myanmar-real-estate-1.onrender.com/api", // Render ပေါ်ရှိ Backend URL အမှန်ကို ထည့်ပါ
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
