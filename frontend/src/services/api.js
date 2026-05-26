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
  getProvinces: () => fetchApi('/references/provinces'),
  getCities: (provinceId) => fetchApi(`/references/cities/${provinceId}`),
};

export const seller = {
  register: (data) => fetchApi('/seller/register', { method: 'POST', body: JSON.stringify(data) }),
  getMyProfile: () => fetchApi('/seller/profiles/me'),
};

export const panenApi = {
  list: (params) => fetchApi(`/panen?${new URLSearchParams(params)}`),
  create: (data) => fetchApi('/panen', { method: 'POST', body: JSON.stringify(data) }),
  getById: (id) => fetchApi(`/panen/${id}`),
  update: (id, data) => fetchApi(`/panen/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchApi(`/panen/${id}`, { method: 'DELETE' }),
};
