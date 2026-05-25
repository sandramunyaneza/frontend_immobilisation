import { useEffect, useState } from 'react';

/** Hook générique pour charger des données depuis l'API */
export default function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = () => {
    setLoading(true);
    setError(null);
    fetchFn()
      .then((res) => setData(Array.isArray(res) ? res : res ? [res] : []))
      .catch((err) =>
        setError(err.response?.data?.detail || err.message || 'Erreur de chargement')
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, setError, reload, setData };
}
