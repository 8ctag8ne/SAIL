import axios from "axios";
import BASE_URL from "../config";

const instance = axios.create({
  baseURL: BASE_URL+"/api",
});

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
  
    // Ініціалізуємо headers, якщо вони відсутні
    if (!config.headers) {
      config.headers = {};
    }
  
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  
    return config;
  });

export default instance;