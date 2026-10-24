import { useEffect, useState } from 'react';
import { api } from './api';
import { useApp } from './context';

export function useResource(path) {
  const { revision, resources } = useApp();
  const [state, setState] = useState({ data: null, loading: !!path, error: null });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ path, revision, data: null, loading: !!path, error: null });
    if (path) resources.load(path, api)
      .then(data => { if (active) setState({ path, revision, data, loading: false, error: null }); })
      .catch(error => { if (active) setState({ path, revision, data: null, loading: false, error }); });
    // Shared requests may still be needed by another component after unmount.
    return () => { active = false; };
  }, [path, retry, revision, resources]);
  const current = state.path === path && state.revision === revision ? state : { data: null, loading: !!path, error: null };
  return { ...current, retry: () => { if (path) resources.invalidate(path); setRetry(r => r + 1); } };
}
