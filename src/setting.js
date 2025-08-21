const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:5000"
    : "https://salex-flask-server.onrender.com";

export default API_BASE;
