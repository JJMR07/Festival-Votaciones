import { Suspense, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../app/context';
import { subscribeRequests, pendingRequests } from '../app/api';

export function PageLoader() {
  const { t } = useApp();
  return <div className="page-loader" role="status">
    <span className="loader-orbit" aria-hidden="true"><span/><span/><span/></span>
    <p>{t.cargando_pagina}</p>
  </div>;
}

export function RouteContent({ children }) {
  const { pathname } = useLocation();
  return <Suspense key={pathname} fallback={<PageLoader/>}>{children}</Suspense>;
}

export function NavigationLoader() {
  const location = useLocation();
  const pending = useSyncExternalStore(subscribeRequests, pendingRequests);
  return <div key={location.key} className={`navigation-loader${pending ? ' is-loading' : ''}`} aria-hidden="true"><span/></div>;
}
