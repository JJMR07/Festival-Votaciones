import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, post } from './api';
import { useTheme } from './theme';
import { createResourceCache } from './resources';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ initialConfig, children }) {
  const appearance = useTheme();
  const [config, setConfig] = useState(initialConfig);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [revision, setRevision] = useState(0);
  const resources = useMemo(() => createResourceCache(), []);
  const refreshSession = async () => {
    setAuthError(false);
    try { const result = await api('auth/sesion/'); setUser(result.user); }
    catch { setAuthError(true); }
    finally { setAuthReady(true); }
  };
  useEffect(() => { refreshSession(); }, []);
  // Al volver del admin, la marca y el catálogo se actualizan sin reiniciar el servidor.
  useEffect(() => {
    const refresh = () => {
      resources.clear();
      api('configuracion/').then(setConfig).catch(() => {});
      setRevision(r => r + 1);
      refreshSession();
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [resources]);
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', config.color_primario);
    document.documentElement.style.setProperty('--accent', config.color_acento);
  }, [config]);
  // Reload after logout clears the session and all account state together.
  async function signout() { await post('auth/logout/'); window.location.assign('/'); }
  return <AppContext.Provider value={{ config, t: config.textos, user, setUser, signout, authReady, authError, refreshSession, revision, resources, ...appearance }}>
    {children}
  </AppContext.Provider>;
}
