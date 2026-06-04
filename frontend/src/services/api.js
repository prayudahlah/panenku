import { API_URL } from '../constants';

export async function fetchApi(path, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { success: false, message: 'Waktu permintaan habis, silakan coba lagi', errorCode: 'ERR-TIMEOUT-01' };
    }
    return { success: false, message: 'Terjadi kesalahan jaringan' };
  }
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
  getAllCities: () => fetchApi('/cities'),
  getProductCategories: () => fetchApi('/product-categories'),
  getUnits: () => fetchApi('/units'),
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

export const products = {
  list: (params) => fetchApi(`/products?${new URLSearchParams(params)}`),
};

export const panenApi = {
  list: (params) => fetchApi(`/panen?${new URLSearchParams(params)}`),
  create: (data) => fetchApi('/panen', { method: 'POST', body: JSON.stringify(data) }),
  getById: (id) => fetchApi(`/panen/${id}`),
  update: (id, data) => fetchApi(`/panen/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchApi(`/panen/${id}`, { method: 'DELETE' }),
};

export const contracts = {
  create: (data) => fetchApi('/contracts', { method: 'POST', body: JSON.stringify(data) }),
  list: () => fetchApi('/contracts'),
  getById: (id) => fetchApi(`/contracts/${id}`),
  respond: (id, data) => fetchApi(`/contracts/${id}/respond`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const userAddresses = {
  list: () => fetchApi('/users/addresses'),
  create: (data) => fetchApi('/users/addresses', { method: 'POST', body: JSON.stringify(data) }),
};

export const negotiations = {
  initiate: (data) => fetchApi('/negotiations', { method: 'POST', body: JSON.stringify(data) }),
  list: () => fetchApi('/negotiations'),
  getById: (id) => fetchApi(`/negotiations/${id}`),
  sellerRespond: (id, data) => fetchApi(`/negotiations/${id}/seller`, { method: 'PATCH', body: JSON.stringify(data) }),
  buyerRespond: (id, data) => fetchApi(`/negotiations/${id}/buyer`, { method: 'PATCH', body: JSON.stringify(data) }),
};
