import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

//  Main Campus360 backend
export const MAIN_API_BASE ="https://campus360-backend-coxr.onrender.com/api";

//  Campus Navigation Chatbot backend
export const CHATBOT_BASE_URL = "https://campus360-backend-coxr.onrender.com";

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
