import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// AuthContext registers a handler so an expired/invalid session (401) clears
// auth state instead of leaving the user stuck in a logged-in shell with
// silently failing requests.
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) onUnauthorized();
    return Promise.reject(error);
  }
);

export default api;
