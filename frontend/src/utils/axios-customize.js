import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8080";

const instance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
});

// Trang thai refresh de tranh goi nhieu lan cung luc
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  failedQueue = [];
};

// Gan access token vao moi request
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Xu ly response: unwrap data + tu dong refresh khi 401
instance.interceptors.response.use(
  (response) => response.data, // Giu nguyen nhu cu

  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Chi xu ly 401, khong loop
    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Chinh request refresh bi 401 → logout han
    if (originalRequest.url?.includes("/api/auth/refresh")) {
      _forceLogout();
      return Promise.reject(error);
    }

    // Dang co request khac refresh → xep hang cho
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return instance(originalRequest);
      });
    }

    // Bat dau refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) throw new Error("No refresh token");

      // Goi thang axios goc (khong qua instance) de tranh interceptor loop
      // Dung field "refreshToken" camelCase - khop voi auth.validator.js
      const { data } = await axios.post(
        `${BACKEND_URL}/api/auth/refresh`,
        { refreshToken },
        { timeout: 10000 }
      );

      // Backend tra: { success, data: { accessToken, refreshToken } }
      const newAccessToken = data?.data?.accessToken;
      const newRefreshToken = data?.data?.refreshToken;

      if (!newAccessToken) throw new Error("Khong nhan duoc access token moi");

      // Luu ca 2 token moi
      localStorage.setItem("access_token", newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem("refresh_token", newRefreshToken);
      }

      instance.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

      // Cho cac request dang cho chay lai
      processQueue(null, newAccessToken);

      // Retry request bi loi
      originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
      return instance(originalRequest);

    } catch (refreshError) {
      processQueue(refreshError, null);
      _forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

function _forceLogout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");

  // Dispatch Redux logout (dynamic import tranh circular dependency)
  Promise.all([
    import("../redux/store"),
    import("../redux/account/accountSlice"),
  ])
    .then(([{ default: store }, { doLogoutAction }]) => {
      store.dispatch(doLogoutAction());
    })
    .catch(() => {});

  if (!window.location.pathname.includes("/login")) {
    window.location.href = "/login";
  }
}

export default instance;
