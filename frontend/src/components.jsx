import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowLeft, ArrowRight, Music2, Menu, X, Search, SlidersHorizontal, AlertCircle, LoaderCircle, Info, LogOut, Sun, Moon } from 'lucide-react';
import { useApp } from './context';
import { useResource } from './hooks';

export function Artwork({ src, className = '', alt = '' }) {
  const { config } = useApp();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed ? <div className={`art-fallback ${className}`} role={alt ? 'img' : undefined} aria-label={alt || undefined}><Music2 /></div>
    : <img className={className} src={src || config.imagen_predeterminada} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

export function Layout({ children }) {
  const { config, t, user, signout } = useApp();
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef(null);
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); mainRef.current?.focus({ preventScroll: true }); }, [location.pathname]);
  useEffect(() => { const close = e => { if (e.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, []);
  return <>
    <a className="skip-link" href="#contenido">{t.saltar}</a>
    <header className="site-header"><div className="header-inner">
      <Link to="/" className="brand"><Artwork src={config.logo} /><span><strong>{config.nombre_corto}</strong><small>{config.subtitulo}</small></span></Link>
      <nav id="navigation" className={open ? 'navigation is-open' : 'navigation'} aria-label={t.navegacion}>
        <NavLink to="/" end>{t.inicio}</NavLink><NavLink to="/ediciones/">{t.ediciones}</NavLink>
        <NavLink to="/categorias/">{t.categorias}</NavLink><NavLink to="/votaciones/">{t.votaciones}</NavLink>
        <NavLink to="/resultados/">{t.resultados}</NavLink>
        <Link className="btn btn-small" to={user ? '/cuentas/perfil/' : '/cuentas/login/'}>{user ? t.perfil : t.entrar}<ArrowUpRight size={15} /></Link>
      </nav>
      <div className="header-tools"><ThemePicker/><button className="menu-toggle icon-btn" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="navigation" aria-label={open ? t.cerrar_menu : t.abrir_menu}>{open ? <X /> : <Menu />}</button></div>
    </div></header>
    <main id="contenido" ref={mainRef} tabIndex={-1}>{children}</main>
    <footer className="site-footer"><div className="footer-top wrap"><div><Link to="/" className="footer-brand">{config.nombre_corto}<Music2 size={22}/></Link><p>{t.pie}</p></div><div className="footer-links"><Link to="/ediciones/">{t.ediciones}</Link><Link to="/categorias/">{t.categorias}</Link><Link to="/votaciones/">{t.votaciones}</Link>{user?.is_staff && <a href="/admin/">{t.administrar}</a>}{user && <button onClick={async () => { try { await signout(); navigate('/'); } catch { setLogoutError(true); } }}><LogOut size={14}/>{t.salir}</button>}</div></div><div className="footer-bottom wrap"><span>© {new Date().getFullYear()} {config.nombre}</span><span>{t.pie_nota}</span></div>{logoutError && <p role="alert">{t.error}</p>}</footer>
  </>;
}

export function ThemePicker() {
  const { t, resolvedTheme, setTheme } = useApp();
  const isDark = resolvedTheme === 'dark';
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? t.cambiar_a_claro : t.cambiar_a_oscuro;
  return <button type="button" className="theme-toggle" aria-label={label} title={label} onClick={() => setTheme(isDark ? 'light' : 'dark')}><Icon size={20} aria-hidden="true"/></button>;
}

export function PageHeading({ eyebrow, title, description }) {
  const { config } = useApp();
  useEffect(() => { document.title = `${eyebrow} · ${config.nombre_corto}`; }, [eyebrow, config.nombre_corto]);
  return <header className="page-heading"><span className="eyebrow"><span/>{eyebrow}</span><h1>{title}</h1><p>{description}</p></header>;
}

export function ResourceState({ resource }) {
  const { t } = useApp();
  if (resource.loading) return <div className="state" role="status"><LoaderCircle className="spin"/><p>{t.cargando}</p></div>;
  if (resource.error) return <div className="state" role="alert"><AlertCircle/><h2>{resource.error.status === 404 ? t.no_encontrado : t.error}</h2><button className="btn btn-outline" onClick={resource.retry}>{t.reintentar}</button></div>;
  return null;
}

export function Empty({ message }) {
  const { t } = useApp();
  return <div className="state empty"><Music2/><h2>{message || t.sin_datos}</h2><p>{t.sin_datos_ayuda}</p></div>;
}

export function Notice() {
  const { t } = useApp();
  return <aside className="notice"><Info size={21}/><div><strong>{t.sin_votos}</strong><p>{t.aviso_votos}</p></div></aside>;
}

export function Pagination({ data, onChange }) {
  const { t } = useApp();
  if (!data || data.paginas <= 1) return null;
  return <nav className="pagination" aria-label={t.pagina}><button className="btn btn-outline" disabled={data.pagina <= 1} onClick={() => onChange(data.pagina - 1)}><ArrowLeft size={16}/>{t.anterior}</button><span>{t.pagina} {data.pagina} {t.de} {data.paginas}</span><button className="btn btn-outline" disabled={data.pagina >= data.paginas} onClick={() => onChange(data.pagina + 1)}>{t.siguiente}<ArrowRight size={16}/></button></nav>;
}

function FilterSelect({ endpoint, label, value, name, emptyLabel, onChange }) {
  const { t } = useApp();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const resource = useResource(`${endpoint}${endpoint.includes('?') ? '&' : '?'}limite=48&pagina=${page}`);
  useEffect(() => { if (resource.data) setItems(previous => page === 1 ? resource.data.items : [...new Map([...previous, ...resource.data.items].map(item => [item.id, item])).values()]); }, [resource.data, page]);
  return <label className="filter-select"><span>{label}</span><select name={name} value={value || ''} onChange={event => {
    if (event.target.value === '__more__') { setPage(p => p + 1); return; }
    if (event.target.value === '__retry__') { resource.retry(); return; }
    onChange(event);
  }}><option value="">{emptyLabel}</option>
    {value && !items.some(item => String(item.id) === value) && <option value={value}>{label} #{value}</option>}
    {items.map(item => <option key={item.id} value={item.id}>{item.nombre} · {item.anio}</option>)}
    {resource.loading && <option disabled>{t.cargando}</option>}
    {resource.error && <option value="__retry__">{t.reintentar}</option>}
    {resource.data && resource.data.pagina < resource.data.paginas && <option value="__more__">{t.siguiente}…</option>}
  </select></label>;
}

export function Filters({ params, setParams, showEditions = true, showCategories = false }) {
  const { t } = useApp();
  const [q, setQ] = useState(params.get('q') || '');
  useEffect(() => setQ(params.get('q') || ''), [params]);
  const change = (key, value) => { const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key); next.delete('pagina'); if (key === 'edicion') next.delete('categoria'); setParams(next); };
  return <form className="filters" onSubmit={e => { e.preventDefault(); change('q', q); }}>
    <div className="filter-icon"><SlidersHorizontal size={19}/></div>
    {showEditions && <FilterSelect endpoint="ediciones/" label={t.edicion} value={params.get('edicion')} name="edicion" emptyLabel={t.todas_ediciones} onChange={e => change('edicion', e.target.value)}/>}
    {showCategories && <FilterSelect key={params.get('edicion') || 'all'} endpoint={`categorias/?${params.get('edicion') ? `edicion=${params.get('edicion')}` : ''}`} label={t.categoria} value={params.get('categoria')} name="categoria" emptyLabel={t.todas_categorias} onChange={e => change('categoria', e.target.value)}/>}
    <label className="search-field"><Search size={18}/><input type="search" aria-label={t.buscar_label} placeholder={t.buscar} value={q} onChange={e => setQ(e.target.value)} maxLength={150}/></label>
    <button className="btn btn-small" type="submit">{t.aplicar}</button>
    {params.size > 0 && <button className="clear-filter" type="button" onClick={() => { setQ(''); setParams({}); }}>{t.limpiar}</button>}
  </form>;
}

export function CatalogCard({ item, kind }) {
  const { t } = useApp();
  const title = item.titulo || item.nombre;
  const to = kind === 'ediciones' ? `/categorias/?edicion=${item.id}` : kind === 'categorias' ? `/votaciones/?categoria=${item.id}&edicion=${item.edicion_id}` : `/votaciones/${item.id}/`;
  return <article className={`catalog-card ${kind}`}><Link className="card-image" to={to} tabIndex={-1} aria-hidden="true"><Artwork src={item.imagen}/><span className="image-tag">{item.anio}</span>{kind === 'votaciones' && <span className={`status status-${item.estado}`}>{t[`estado_${item.estado}`]}</span>}</Link>
    <div className="card-body"><span className="card-eyebrow">{item.categoria_nombre || item.edicion_nombre || t.edicion}</span><h3><Link to={to}>{title}</Link></h3><p>{item.descripcion || t.sin_descripcion}</p><div className="card-bottom"><span>{kind === 'ediciones' ? `${item.total_categorias} ${(item.total_categorias === 1 ? t.categoria : t.categorias).toLowerCase()}` : kind === 'categorias' ? `${item.total_votaciones} ${item.total_votaciones === 1 ? t.votacion_singular : t.votaciones.toLowerCase()}` : `${item.total_opciones} ${item.total_opciones === 1 ? t.opcion_singular : t.opciones.toLowerCase()}`}</span><Link to={to} className="card-arrow" aria-label={`${t.ver_detalle}: ${title}`}><ArrowUpRight size={20}/></Link></div></div>
  </article>;
}
