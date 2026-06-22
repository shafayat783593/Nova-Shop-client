import axios from 'axios';

const server = process.env.NEXT_PUBLIC_BACKEND_URL;

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

const api = axios.create({
    baseURL: server,
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
            const csrfToken = getCookie('csrfToken');
            if (csrfToken) {
                config.headers['x-csrf-token'] = csrfToken;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

let isRefreshing = false;
let isRefreshingCSRFToken = false;
let failedQueue = [];
let csrffailedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const processCSRFQueue = (error, token = null) => {
    csrffailedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    csrffailedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // ✅ 401 — access token expire, refresh করো
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes("/api/auth/refresh-token")
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => api(originalRequest)).catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await api.post("/api/auth/refresh-token");
                processQueue(null);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                // refresh ও fail — force logout
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("auth:logout"));
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // ✅ 403 — CSRF error (existing code same থাকবে)
        if (
            error.response?.status === 403 &&
            !originalRequest._csrfRetry &&
            !originalRequest._retry
        ) {
            const errorCode = error.response.data.code || '';
            if (errorCode.startsWith('CSRF_')) {
                if (isRefreshingCSRFToken) {
                    return new Promise((resolve, reject) => {
                        csrffailedQueue.push({ resolve, reject });
                    }).then(() => api(originalRequest));
                }
                originalRequest._retry = true;
                originalRequest._csrfRetry = true;
                isRefreshingCSRFToken = true;

                try {
                    await api.post('/api/auth/refresh-csrf');
                    const newCsrf = getCookie('csrfToken');
                    if (newCsrf) {
                        originalRequest.headers['x-csrf-token'] = newCsrf;
                    }
                    processCSRFQueue(null);
                    return api(originalRequest);
                } catch (err) {
                    processCSRFQueue(err);
                    return Promise.reject(err);
                } finally {
                    isRefreshingCSRFToken = false;
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
















// import axios from 'axios';

// const server = process.env.NEXT_PUBLIC_BACKEND_URL;

// const api = axios.create({
//     baseURL: server,
//     withCredentials: true,
// });

// let isRefreshing = false;
// let failedQueue = [];

// const processQueue = (error, token = null) => {
//     failedQueue.forEach((prom) => {
//         if (error) {
//             prom.reject(error);
//         } else {
//             prom.resolve(token);
//         }
//     });
//     failedQueue = [];
// };

// api.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;

//         // Handle 403 (or token expired) errors
//         if (
//             error.response?.status === 403 &&
//             !originalRequest._authRetry
//         ) {
//             if (isRefreshing) {
//                 return new Promise((resolve, reject) => {
//                     failedQueue.push({ resolve, reject });
//                 }).then(() => api(originalRequest));
//             }

//             originalRequest._authRetry = true;
//             isRefreshing = true;

//             try {
//                 await api.post('/api/auth/refresh-token'); // refresh token endpoint
//                 processQueue(null);
//                 return api(originalRequest);
//             } catch (err) {
//                 processQueue(err, null);
//                 return Promise.reject(err);
//             } finally {
//                 isRefreshing = false;
//             }
//         }

//         return Promise.reject(error);
//     }
// );

// export default api;