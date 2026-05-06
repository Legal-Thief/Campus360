import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Main Campus360 backend ──────────────────────────────────────────────────
// Change this IP to your machine's local IP when running on a physical device
export const MAIN_API_BASE = "http://10.20.40.208:5000/api";

// ── Campus Navigation Chatbot backend ──────────────────────────────────────
// Change this IP to your teammate's machine IP (or same machine if merged)
export const CHATBOT_BASE_URL = "http://10.20.40.208:5000";

const API = axios.create({
  baseURL: MAIN_API_BASE,
});

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
