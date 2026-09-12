import axios from "axios";
import BASE_URL from "../config";
import { getDeviceId } from "../utils/deviceId";

const instance = axios.create({
  baseURL: BASE_URL + "/api",
});

instance.interceptors.request.use((config: any) => {
  const token = localStorage.getItem("token");

  if (!config.headers) {
    config.headers = {};
  }

  const deviceId = getDeviceId();
  if (deviceId) {
    config.headers["X-Device-Id"] = deviceId;
  }

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

export default instance;