import { createContext, useContext, useEffect, useState } from 'react';
import { api, post } from './api';
import { useTheme } from './theme';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ initialConfig, children }) {
  const appearance = useTheme();
  const [config, setConfig] = useState(initialConfig);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [revision, setRevision] = useState(0);
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
      api('configuracion/').then(setConfig).catch(() => {});
      setRevision(r => r + 1);
      refreshSession();
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', config.color_primario);
    document.documentElement.style.setProperty('--accent', config.color_acento);
  }, [config]);
  async function signout() { await post('auth/logout/'); setUser(null); }
  return <AppContext.Provider value={{ config, t: config.textos, user, setUser, signout, authReady, authError, refreshSession, revision, ...appearance }}>
    {children}
  </AppContext.Provider>;
}
