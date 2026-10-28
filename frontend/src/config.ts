const rawUrl =
  process.env.REACT_APP_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:8080";
const BASE_URL = rawUrl.replace(/\/+$/, "");

export default BASE_URL;