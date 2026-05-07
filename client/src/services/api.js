import axios from "axios";

const api = axios.create({
  baseURL: "https://babybargains.onrender.com/api"
});

export default api;