import { useEffect, useState } from 'react';
import { api } from './api';
import { useApp } from './context';

export function useResource(path) {
  const { revision } = useApp();
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    api(path, { signal: controller.signal })
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => { if (error.name !== 'AbortError') setState({ data: null, loading: false, error }); });
    return () => controller.abort();
  }, [path, retry, revision]);
  return { ...state, retry: () => setRetry(r => r + 1) };
}
