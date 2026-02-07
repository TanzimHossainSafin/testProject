import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    // Log 403 errors for debugging (use warn to avoid Next.js error overlay)
    if (error.response?.status === 403) {
      console.warn('403 Forbidden:', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.response?.data?.message,
      });
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const userApi = {
  getAll: (role?: string) => api.get('/users', { params: { role } }),
  getById: (id: string) => api.get(`/users/${id}`),
  updateRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, { role }),
  updateProfile: (data: { name?: string; profile?: object }) =>
    api.patch('/users/profile/update', data),
};

export const projectApi = {
  getAll: (status?: string) => api.get('/projects', { params: { status } }),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: {
    title: string;
    description: string;
    requirements?: string;
    budget?: number;
    deadline?: string;
  }) => api.post('/projects', data),
  update: (id: string, data: object) => api.patch(`/projects/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/projects/${id}/status`, { status }),
};

export const requestApi = {
  create: (data: { projectId: string; message?: string }) =>
    api.post('/requests', data),
  getForProject: (projectId: string) =>
    api.get(`/requests/project/${projectId}`),
  getMy: () => api.get('/requests/my'),
  accept: (requestId: string) => api.patch(`/requests/${requestId}/accept`),
  reject: (requestId: string) => api.patch(`/requests/${requestId}/reject`),
};

export const taskApi = {
  getForProject: (projectId: string) => api.get(`/tasks/project/${projectId}`),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: {
    projectId: string;
    title: string;
    description?: string;
    deadline?: string;
  }) => api.post('/tasks', data),
  update: (id: string, data: object) => api.patch(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

export const submissionApi = {
  create: (formData: FormData) =>
    api.post('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getForTask: (taskId: string) => api.get(`/submissions/task/${taskId}`),
  review: (submissionId: string, data: { status: string; reviewNotes?: string }) =>
    api.patch(`/submissions/${submissionId}/review`, data),
  getDownloadUrl: (submissionId: string) =>
    `${API_URL}/submissions/${submissionId}/download`,
  download: async (submissionId: string, fileName: string) => {
    const response = await api.get(`/submissions/${submissionId}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default api;
