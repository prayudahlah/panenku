import { useState } from 'react';
import { fetchApi } from '../services/api';

export function useApi(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const get = async (params) => {
    setLoading(true);
    try {
      const res = await fetchApi(path, { method: 'GET' });
      setData(res);
      return res;
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, get };
}
