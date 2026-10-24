import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, UserRound } from 'lucide-react';
import { useApp } from '../app/context';
import { Artwork } from './shared';

export function Breadcrumbs({ items }) {
  const { t } = useApp();
  return <nav className="breadcrumbs" aria-label={t.ruta_navegacion}><ol>
    <li><Link to="/">{t.inicio}</Link></li>
    {items.map((item, index) => <li key={index}>{item.to
      ? <Link to={item.to}>{item.label}</Link>
      : <span aria-current="page">{item.label}</span>}</li>)}
  </ol></nav>;
}

export function CatalogSkeleton() {
  const { t } = useApp();
  return <div role="status" aria-label={t.cargando} className="catalog-loading">
    <span className="sr-only">{t.cargando}</span>
    <div className="skeleton-grid" aria-hidden="true">{[0, 1, 2, 3].map(key =>
      <div className="skeleton-card" key={key}><div className="skeleton skeleton-tag"/>
        <div className="skeleton skeleton-title"/><div className="skeleton skeleton-line"/>
        <div className="skeleton skeleton-line"/><div className="skeleton skeleton-button"/>
      </div>)}</div>
  </div>;
}

export function ResultsIntro() {
  const { t } = useApp();
  return <aside className="results-intro">
    <span className="results-symbol" aria-hidden="true"><UserRound size={28}/></span>
    <div><h2>{t.resultados_pendientes}</h2><p>{t.resultados_alcance}</p></div>
  </aside>;
}

export function ParticipantCard({ item, context }) {
  const { t } = useApp();
  const dialog = useRef(null);
  const trigger = useRef(null);
  const close = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    return () => { if (element?.open) element.close(); };
  }, []);
  function open() {
    dialog.current.showModal();
    close.current.focus();
  }
  return <article className="participant participant-card">
    <Artwork src={item.imagen} alt={`${t.foto_participante} ${item.nombre}`}/>
    <div className="participant-copy"><h3>{item.nombre}</h3>
      <p>{item.descripcion || t.sin_descripcion}</p>
      <button ref={trigger} className="text-link participant-open" onClick={open}
        aria-label={`${t.ver_ficha}: ${item.nombre}`}>{t.ver_ficha}</button>
    </div>
    <dialog ref={dialog} className="participant-dialog" aria-labelledby={`participante-${item.id}`}
      onClose={() => trigger.current?.focus()} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
      <button ref={close} className="dialog-close" aria-label={t.cerrar_ficha} onClick={() => dialog.current.close()}><X aria-hidden="true"/></button>
      <Artwork src={item.imagen} alt={`${t.foto_participante} ${item.nombre}`} className="participant-portrait"/>
      <div className="participant-biography"><p className="participant-context">{context}</p>
        <h2 id={`participante-${item.id}`}>{item.nombre}</h2>
        <p>{item.descripcion || t.sin_descripcion}</p>
      </div>
    </dialog>
  </article>;
}
