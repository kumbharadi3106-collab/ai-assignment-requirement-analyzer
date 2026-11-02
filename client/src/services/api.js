import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 minutes for AI analysis
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

export const dashboardAPI = {
  getStats: () => api.get('/assignments/dashboard'),
}

export const assignmentsAPI = {
  getAll: () => api.get('/assignments'),
  getById: (id) => api.get(`/assignments/${id}`),
  analyze: (title, text) => api.post('/assignments/analyze', { title, text }),
  delete: (id) => api.delete(`/assignments/${id}`),
  export: (id, format) =>
    axios.get(`/api/assignments/${id}/export?format=${format}`, {
      responseType: 'blob',
    }),
}

export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
}

export const uploadAPI = {
  uploadPDF: (formData) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    }),
}

export const healthAPI = {
  check: () => api.get('/health'),
}

