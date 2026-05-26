const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function fetchApi(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  return res.json();
}

export const auth = {
  login: (data) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => fetchApi('/auth/logout', { method: 'POST' }),
  me: () => fetchApi('/auth/me'),
};

export const references = {
  getProvinces: () => fetchApi('/provinces'),
  getCities: (provinceId) => fetchApi(`/cities/${provinceId}`),
};

export const seller = {
  register: (data) => fetchApi('/sellers/register', { method: 'POST', body: JSON.stringify(data) }),
  getMyProfile: () => fetchApi('/sellers/profiles/me'),
};

export const admin = {
  listUsers: () => fetchApi('/users'),
  updateUserStatus: (id, status) => fetchApi(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  listSellers: () => fetchApi('/sellers'),
  listProducts: (sellerId) => fetchApi(`/products?sellerId=${sellerId}`),
  takedownProduct: (id) => fetchApi(`/products/${id}/takedown`, { method: 'PATCH' }),
};

export const audit = {
  list: (params) => fetchApi(`/audit-logs?${new URLSearchParams(params)}`),
};

export const panenApi = {
  list: (params) => fetchApi(`/panen?${new URLSearchParams(params)}`),
  create: (data) => fetchApi('/panen', { method: 'POST', body: JSON.stringify(data) }),
  getById: (id) => fetchApi(`/panen/${id}`),
  update: (id, data) => fetchApi(`/panen/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchApi(`/panen/${id}`, { method: 'DELETE' }),
};
