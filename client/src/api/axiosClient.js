import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Địa chỉ Backend của bạn
});

// Interceptor: Chạy trước khi bất kỳ request nào được gửi đi
axiosClient.interceptors.request.use((config) => {
  // Lấy role đang lưu trong localStorage (đã cài đặt ở RoleContext)
  const role = localStorage.getItem('app_role') || 'student';
  
  // Gắn vào header
  config.headers['x-role'] = role;
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosClient;