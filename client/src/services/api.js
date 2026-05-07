import axios from "axios";

const api = axios.create({
  baseURL: "https://babybargains.onrender.com/"
});

export default api;