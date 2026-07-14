import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

axiosClient.defaults.headers.common['x-role'] = 'student';

export const setApiRole = (role) => {
  axiosClient.defaults.headers.common['x-role'] = role;
};

axiosClient.interceptors.request.use((config) => {
  if (!navigator.onLine && !['get', 'head'].includes(config.method?.toLowerCase())) {
    return Promise.reject(new Error('Bạn cần kết nối mạng để thực hiện thay đổi này.'));
  }
  return config;
});

export default axiosClient;
