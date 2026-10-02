import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5002/api", // Proxy မှတစ်ဆင့် Backend Port 5000 သို့ Auto ရောက်သွားပါမည်
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
